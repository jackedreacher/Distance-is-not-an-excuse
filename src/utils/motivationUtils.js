// Daily motivation messages from famous people for exam preparation
// Static motivationMessages removed. Online quotes are used via getMotivationForDayAsync.

import { API_BASE_URL } from '../services/api'

// Deprecated: static random motivation; prefer getMotivationForDayAsync
export const getRandomMotivation = () => {
  return {
    author: 'Bilinmeyen',
    quote: 'Bugün küçük bir adım at; bilgi birikimin seni başarıya götürecek.',
    motivation: 'Senin azmin her şeyi başarır. 💪✨',
  }
}

// Get motivation for specific day (fallback when online quotes unavailable)
export const getMotivationForDay = (dayOfYear) => {
  const defaults = [
    { author: 'Bilinmeyen', quote: 'Küçük adımlar büyük fark yaratır.', motivation: 'Bugün bir sayfa daha! 📚✨' },
    { author: 'Bilinmeyen', quote: 'Azim başarıyı getirir.', motivation: 'Devam et, çok yaklaştın! 💪' },
    { author: 'Bilinmeyen', quote: 'Her gün yeni bir başlangıçtır.', motivation: 'Bugünü değerlendir! 🌟' },
  ]
  return defaults[dayOfYear % defaults.length]
}

// Online quotes integration - caches in localStorage for 24h
const QUOTES_CACHE_KEY = 'quotesCacheV2'
const QUOTES_CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 saat

// THEME FILTER: azim, çalışkanlık, motivasyon, kararlılık, bağlılık
const THEME_KEYWORDS = [
  'azim', 'çalış', 'çalışkan', 'motivasyon', 'motive', 'karar', 'kararlılık', 'istikrar', 'sebat', 'disiplin',
  'hedef', 'emek', 'gayret', 'başarı', 'devam', 'vazgeç', 'sabır', 'adanmış', 'bağlılık', 'özveri', 'irade',
  'direnç', 'ısrar', 'sebat et'
]
const norm = (s) => (s || '').toLocaleLowerCase('tr-TR')
const applyThemeFilter = (quotes) => {
  if (!Array.isArray(quotes)) return []
  const filtered = quotes.filter(q => {
    const text = norm(q?.quote) + ' ' + norm(q?.motivation)
    return THEME_KEYWORDS.some(k => text.includes(k))
  })
  return filtered
}

const fetchServerQuotes = async () => {
  const res = await fetch(`${API_BASE_URL}/quotes`)
  if (!res.ok) throw new Error('Quotes proxy request failed')
  const data = await res.json()
  const list = Array.isArray(data) ? data : Array.isArray(data?.quotes) ? data.quotes : []
  if (!list.length) throw new Error('Empty quotes from proxy')
  return list
}

// Alternatif kaynak: Quotable (direct, CORS destekli)
const fetchQuotableQuotes = async () => {
  const res = await fetch('https://api.quotable.io/quotes?limit=200')
  if (!res.ok) throw new Error('Quotable API request failed')
  const data = await res.json()
  const seen = new Set()
  const mapped = []
  for (const item of (data.results || [])) {
    if (!item || !item.content) continue
    if (seen.has(item.content)) continue
    seen.add(item.content)
    mapped.push({
      author: item.author || 'Bilinmeyen',
      quote: item.content,
      motivation: 'Bugün küçük bir adım at; bilgi birikimin seni başarıya götürecek. 💪✨',
    })
  }
  return mapped
}

const getQuotesFromCacheOrFetch = async () => {
  let cached = null
  try {
    const cachedStr = localStorage.getItem(QUOTES_CACHE_KEY)
    if (cachedStr) {
      const parsed = JSON.parse(cachedStr)
      if (Array.isArray(parsed.quotes) && parsed.quotes.length > 0) {
        cached = parsed
        const isFresh = Date.now() - parsed.timestamp < QUOTES_CACHE_TTL_MS
        if (isFresh) {
          const themed = applyThemeFilter(parsed.quotes)
          return themed.length > 0 ? themed : parsed.quotes
        }
      }
    }
  } catch {
    // sessizce geç
  }

  let quotes = []

  // Önce backend proxy (CORS sorunsuz)
  try {
    quotes = await fetchServerQuotes()
  } catch {
    // proxy başarısız
  }

  // Proxy başarısızsa Quotable'a düş
  if (!quotes || quotes.length === 0) {
    try {
      quotes = await fetchQuotableQuotes()
    } catch {
      // quotable başarısız
    }
  }

  if (quotes && quotes.length > 0) {
    const themed = applyThemeFilter(quotes)
    const finalQuotes = themed.length > 0 ? themed : quotes
    const limited = finalQuotes.slice(0, 500)
    try {
      localStorage.setItem(QUOTES_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        quotes: limited,
      }))
    } catch {
      // storage hataları sessizce yut
    }
    return limited
  }

  // Ağ başarısızsa, bayat önbelleği kullan
  if (cached && Array.isArray(cached.quotes) && cached.quotes.length > 0) {
    const themed = applyThemeFilter(cached.quotes)
    return themed.length > 0 ? themed : cached.quotes
  }

  // Son çare: yerleşik yedek alıntılar
  const themedDefaults = applyThemeFilter(DEFAULT_QUOTES)
  return themedDefaults.length > 0 ? themedDefaults : DEFAULT_QUOTES

  // Tüm kaynaklar başarısız
  // throw (lastError || new Error('Quotes fetch failed from all sources'))
}

// Asenkron: Günün motivasyonunu çevrim içi kaynaktan getir (fallback statik fonksiyon kullanılacak)
export const getMotivationForDayAsync = async (dayOfYear) => {
  const quotes = await getQuotesFromCacheOrFetch()
  const index = dayOfYear % quotes.length
  return quotes[index]
}

// Yerleşik yedek alıntılar (upstream/proxy erişilemezse)
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
]