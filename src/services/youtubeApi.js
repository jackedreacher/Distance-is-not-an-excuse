// YouTube API Configuration
const YOUTUBE_CONFIG = {
  API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY,
  CLIENT_ID: import.meta.env.VITE_YOUTUBE_CLIENT_ID,
  CLIENT_SECRET: import.meta.env.VITE_YOUTUBE_CLIENT_SECRET,
  REDIRECT_URI: 'http://localhost:5173/auth/youtube/callback',
  SCOPES: [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ]
};

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

class YouTubeAPI {
  constructor() {
    this.apiKey = YOUTUBE_CONFIG.API_KEY;
    this.accessToken = localStorage.getItem('youtube_access_token');
  }

  // Müzik arama
  async searchMusic(query, maxResults = 25) {
    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/search?` +
        `part=snippet&type=video&videoCategoryId=10&` +
        `q=${encodeURIComponent(query)}&` +
        `maxResults=${maxResults}&` +
        `key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.formatSearchResults(data.items);
    } catch (error) {
      console.error('YouTube arama hatası:', error);
      throw error;
    }
  }

  // Popüler müzikler
  async getTrendingMusic(regionCode = 'TR') {
    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/videos?` +
        `part=snippet,statistics&` +
        `chart=mostPopular&` +
        `videoCategoryId=10&` +
        `regionCode=${regionCode}&` +
        `maxResults=50&` +
        `key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.formatSearchResults(data.items);
    } catch (error) {
      console.error('Trend müzik hatası:', error);
      throw error;
    }
  }

  // Video detayları
  async getVideoDetails(videoId) {
    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/videos?` +
        `part=snippet,contentDetails,statistics&` +
        `id=${videoId}&` +
        `key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.items[0];
    } catch (error) {
      console.error('Video detay hatası:', error);
      throw error;
    }
  }

  // Playlist oluşturma (OAuth gerekli)
  async createPlaylist(title, description) {
    if (!this.accessToken) {
      throw new Error('OAuth token gerekli');
    }

    try {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/playlists?part=snippet,status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            snippet: {
              title,
              description
            },
            status: {
              privacyStatus: 'private'
            }
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`YouTube API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Playlist oluşturma hatası:', error);
      throw error;
    }
  }

  // Sonuçları formatla
  formatSearchResults(items) {
    if (!items) return [];
    
    return items.map(item => ({
      id: item.id.videoId || item.id,
      title: this.cleanTitle(item.snippet.title),
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      duration: item.contentDetails?.duration,
      viewCount: item.statistics?.viewCount,
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description,
      url: `https://www.youtube.com/watch?v=${item.id.videoId || item.id}`,
      embedUrl: `https://www.youtube.com/embed/${item.id.videoId || item.id}?autoplay=1&enablejsapi=1`,
      source: 'youtube'
    }));
  }

  // Başlığı temizle (HTML entities vs.)
  cleanTitle(title) {
    return title
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'");
  }

  // Duration'ı formatla (PT4M13S -> 4:13)
  formatDuration(duration) {
    if (!duration) return '0:00';
    
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    if (hours) {
      return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    
    return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
  }

  // OAuth kimlik doğrulama
  initiateAuth() {
    const authUrl = 
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${YOUTUBE_CONFIG.CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(YOUTUBE_CONFIG.REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(YOUTUBE_CONFIG.SCOPES.join(' '))}&` +
      `response_type=code&` +
      `access_type=offline`;
    
    window.location.href = authUrl;
  }

  // Access token'ı kaydet
  setAccessToken(token) {
    this.accessToken = token;
    localStorage.setItem('youtube_access_token', token);
  }

  // Access token'ı temizle
  clearAccessToken() {
    this.accessToken = null;
    localStorage.removeItem('youtube_access_token');
  }
}

export default new YouTubeAPI();