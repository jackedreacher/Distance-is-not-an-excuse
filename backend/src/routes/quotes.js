/* eslint-env node */
/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// Basit bellek içi cache (6 saat)
let CACHE = { quotes: [], timestamp: 0 };
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

// Yerleşik yedek alıntılar (upstream erişilemezse)
const DEFAULT_QUOTES = [
  { author: 'Albert Einstein', quote: 'Zorlukların ortasında fırsatlar yatar.', motivation: 'Bugün küçük bir adım at; bilgi birikimin seni başarıya götürecek. 💪✨' },
  { author: 'Confucius', quote: 'Ne kadar yavaş gittiğin önemli değil, yeter ki durma.', motivation: 'Adım adım ilerle, vazgeçme! 🌟' },
  { author: 'Nelson Mandela', quote: 'Başarı, her zaman kazanmak değildir; asıl başarı, asla pes etmemektir.', motivation: 'Denemeye devam! 🎯' },
  { author: 'Eleanor Roosevelt', quote: 'Gelecek, hayallerinin güzelliğine inananlara aittir.', motivation: 'Hayallerine bir adım daha yaklaş! ✨' },
  { author: 'Walt Disney', quote: 'Başlamanın yolu konuşmayı bırakıp yapmaya başlamaktır.', motivation: 'Şimdi başla, gerisi gelir! 🚀' },
  { author: 'Henry Ford', quote: 'Yapabileceğine inanırsan, yolun yarısını kat etmişsindir.', motivation: 'Kendine güven! 💫' },
  { author: 'Maya Angelou', quote: 'Cesaret, tüm diğer erdemlerin üzerinde durduğu temeldir.', motivation: 'Cesur ol, adım at! 🦁' },
  { author: 'Lao Tzu', quote: 'Bin millik yolculuk tek bir adımla başlar.', motivation: 'O ilk adımı bugün at! 🗺️' },
  { author: 'Thomas Edison', quote: 'Başarısız olmadım. Sadece işe yaramayan 10.000 yol buldum.', motivation: 'Hatalar öğretir. Devam! 🔧' },
  { author: 'Bilinmeyen', quote: 'Küçük adımlar büyük fark yaratır.', motivation: 'Bugün bir sayfa daha! 📚✨' }
];

function fetchJson(url, { timeoutMs = 15000, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (err) {
      return reject(new Error('Invalid URL: ' + url + ' -> ' + (err && err.message ? err.message : 'unknown')));
    }
    const protocol = parsed.protocol === 'https:' ? https : http;

    const req = protocol.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'RomanticApp/1.0 (QuotesProxy)',
        'Accept': 'application/json,text/*;q=0.9,*/*;q=0.8',
        ...headers
      }
    }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Upstream status ${res.statusCode}`));
        }
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (parseErr) {
          reject(new Error('Invalid JSON from upstream: ' + parseErr.message));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('Request timed out'));
    });

    req.end();
  });
}

function mapTypeFit(data) {
  const seen = new Set();
  const out = [];
  for (const item of Array.isArray(data) ? data : []) {
    if (!item || !item.text) continue;
    if (seen.has(item.text)) continue;
    seen.add(item.text);
    out.push({
      author: item.author || 'Bilinmeyen',
      quote: item.text,
      motivation: 'Bugün küçük bir adım at; bilgi birikimin seni başarıya götürecek. 💪✨',
    });
  }
  return out;
}

function mapQuotable(data) {
  const seen = new Set();
  const out = [];
  for (const item of Array.isArray(data?.results) ? data.results : []) {
    if (!item || !item.content) continue;
    if (seen.has(item.content)) continue;
    seen.add(item.content);
    out.push({
      author: item.author || 'Bilinmeyen',
      quote: item.content,
      motivation: 'Bugün küçük bir adım at; bilgi birikimin seni başarıya götürecek. 💪✨',
    });
  }
  return out;
}

function getQuotesFromLocal() {
  try {
    const filePath = path.join(__dirname, 'quotes.data.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    const seen = new Set();
    const out = [];
    for (const item of Array.isArray(data) ? data : []) {
      if (!item || !item.quote) continue;
      if (seen.has(item.quote)) continue;
      seen.add(item.quote);
      out.push({
        author: item.author || 'Bilinmeyen',
        quote: item.quote,
        motivation: 'Bugün küçük bir adım at; bilgi birikimin seni başarıya götürecek. 💪✨',
      });
    }
    return out;
  } catch (err) {
    console.warn('Local quotes load failed:', err.message);
    return [];
  }
}

async function getQuotesFromSources() {
  // Önce yerel veri kümesi
  const local = getQuotesFromLocal();
  if (local.length > 0) return { list: local, source: 'local' };
  // Ardından type.fit
  try {
    const tf = await fetchJson('https://type.fit/api/quotes');
    const mapped = mapTypeFit(tf);
    if (mapped.length > 0) return { list: mapped, source: 'typefit' };
  } catch (err) {
    console.warn('type.fit fetch failed, trying Quotable:', err.message);
  }
  // Son olarak Quotable
  try {
    const q = await fetchJson('https://api.quotable.io/quotes?limit=200');
    const mappedQ = mapQuotable(q);
    if (mappedQ.length > 0) return { list: mappedQ, source: 'quotable' };
  } catch (err2) {
    console.warn('Quotable fetch failed:', err2.message);
  }
  return { list: [], source: 'none' };
}

router.get('/', async (req, res) => {
  try {
    // Cache tazeliği
    const fresh = Date.now() - CACHE.timestamp < CACHE_TTL_MS;
    if (fresh && Array.isArray(CACHE.quotes) && CACHE.quotes.length > 0) {
      return res.json({ quotes: CACHE.quotes, source: 'cache' });
    }

    const { list, source } = await getQuotesFromSources();
    let quotes = list;
    let responseSource = source;

    // Upstream boşsa yerleşik yedeğe düş
    if (!Array.isArray(quotes) || quotes.length === 0) {
      quotes = DEFAULT_QUOTES;
      responseSource = 'default';
    }

    // Limit ve cache
    const limited = quotes.slice(0, 500);
    CACHE = { quotes: limited, timestamp: Date.now() };

    return res.json({ quotes: limited, source: responseSource });
  } catch (err) {
    console.error('Quotes proxy error:', err);
    // Tamamen başarısızsa bile, hiç olmazsa yerleşik yedeği döndür
    if (!res.headersSent) {
      const limited = DEFAULT_QUOTES.slice(0, 500);
      CACHE = { quotes: limited, timestamp: Date.now() };
      return res.json({ quotes: limited, source: 'default', stale: true });
    }
  }
});

module.exports = router;