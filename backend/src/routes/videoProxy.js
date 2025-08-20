/* eslint-env node */
/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Video proxy endpoint - herhangi bir videoyu stream eder
router.get('/stream', async (req, res) => {
  try {
    const { url: videoUrl } = req.query;
    
    if (!videoUrl) {
      return res.status(400).json({ 
        error: 'Video URL gerekli', 
        message: 'Lütfen ?url=VIDEO_URL parametresi ekleyin' 
      });
    }

    // URL'yi parse et
    let parsedUrl;
    try {
      parsedUrl = new URL(videoUrl);
    } catch (err) {
      console.error('Geçersiz URL:', err?.message);
      return res.status(400).json({ 
        error: 'Geçersiz URL formatı', 
        message: 'Lütfen geçerli bir URL girin' 
      });
    }

    // HTTP veya HTTPS protokolünü kontrol et
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    // Video isteği için header'lar
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5',
      'Accept-Encoding': 'identity',
      'Connection': 'keep-alive'
    };

    // Range header'ı varsa ekle (video streaming için)
    if (req.headers.range) {
      headers.Range = req.headers.range;
    }

    const proxyReq = protocol.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers
    }, (proxyRes) => {
      // CORS header'larını ekle
      res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length, Content-Type',
        'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges'
      });

      // Orijinal response header'larını kopyala
      res.status(proxyRes.statusCode);
      
      // Video streaming için önemli header'lar
      if (proxyRes.headers['content-type']) {
        res.set('Content-Type', proxyRes.headers['content-type']);
      }
      if (proxyRes.headers['content-length']) {
        res.set('Content-Length', proxyRes.headers['content-length']);
      }
      if (proxyRes.headers['content-range']) {
        res.set('Content-Range', proxyRes.headers['content-range']);
      }
      if (proxyRes.headers['accept-ranges']) {
        res.set('Accept-Ranges', proxyRes.headers['accept-ranges']);
      }

      // Video stream'ini pipe et
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Video proxy hatası:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Video yüklenirken hata oluştu', 
          message: err.message 
        });
      }
    });

    // İstek timeout'u (30 saniye)
    proxyReq.setTimeout(30000, () => {
      proxyReq.destroy();
      if (!res.headersSent) {
        res.status(408).json({ 
          error: 'İstek zaman aşımına uğradı', 
          message: 'Video sunucusu yanıt vermedi' 
        });
      }
    });

    proxyReq.end();

  } catch (err) {
    console.error('Video proxy genel hatası:', err);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Sunucu hatası', 
        message: err.message 
      });
    }
  }
});

// Video metadata endpoint - video bilgilerini alır
router.get('/info', async (req, res) => {
  try {
    const { url: videoUrl } = req.query;
    
    if (!videoUrl) {
      return res.status(400).json({ 
        error: 'Video URL gerekli',
        message: 'Lütfen ?url=VIDEO_URL parametresi ekleyin'
      });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(videoUrl);
    } catch (err) {
      console.error('Geçersiz URL:', err?.message);
      return res.status(400).json({ 
        error: 'Geçersiz URL formatı',
        message: 'Lütfen geçerli bir URL girin'
      });
    }

    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const infoReq = protocol.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'HEAD', // Sadece header bilgilerini al
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (infoRes) => {
      const info = {
        url: videoUrl,
        contentType: infoRes.headers['content-type'] || 'unknown',
        contentLength: infoRes.headers['content-length'] || 'unknown',
        acceptRanges: infoRes.headers['accept-ranges'] === 'bytes',
        statusCode: infoRes.statusCode,
        fileName: parsedUrl.pathname.split('/').pop() || 'video',
        supportStreaming: infoRes.headers['accept-ranges'] === 'bytes'
      };

      res.json(info);
    });

    infoReq.on('error', (err) => {
      console.error('Video info hatası:', err);
      res.status(500).json({ 
        error: 'Video bilgileri alınamadı',
        message: err.message 
      });
    });

    infoReq.setTimeout(10000, () => {
      infoReq.destroy();
      res.status(408).json({ 
        error: 'İstek zaman aşımına uğradı',
        message: 'Video sunucusu yanıt vermedi'
      });
    });

    infoReq.end();

  } catch (err) {
    console.error('Video info genel hatası:', err);
    res.status(500).json({ 
      error: 'Sunucu hatası',
      message: err.message 
    });
  }
});

// OPTIONS request için CORS desteği
router.options('*', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length, Content-Type'
  });
  res.status(200).end();
});

module.exports = router;