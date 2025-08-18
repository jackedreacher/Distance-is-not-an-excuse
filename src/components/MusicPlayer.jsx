import { useState, useEffect, useRef } from 'react'
import { musicService } from '../services/api'
import { useAuth } from '../hooks/useAuth.js'

const MusicPlayer = () => {
  const [songs, setSongs] = useState([])
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    story: '',
    url: '',
    user: '' // 'user1' or 'user2'
  })
  const [currentSongIndex, setCurrentSongIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [view, setView] = useState('playlist') // 'playlist' or 'add'
  const [albumArt, setAlbumArt] = useState('') // Album artwork URL
  const [showEmbed, setShowEmbed] = useState(false) // Whether to show embedded player
  
  const audioRef = useRef(null)
  const { checkTokenValidity } = useAuth()

  // Load songs from API on component mount
  useEffect(() => {
    const loadSongs = async () => {
      try {
        // Check token validity first (skip in development)
        if (!import.meta.env.DEV && localStorage.getItem('bypass_auth') !== 'true') {
          const isValid = await checkTokenValidity();
          if (!isValid) {
            console.log('Token is not valid, skipping songs load');
            return;
          }
        }
        
        const data = await musicService.getAll();
        // Backend now returns array directly, not wrapped in songs property
        if (Array.isArray(data)) {
          setSongs(data);
        }
      } catch (error) {
        console.error('Error loading songs:', error);
      }
    };
    
    loadSongs();
  }, [checkTokenValidity])

  // Handle audio playback
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Playback failed:", e))
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentSongIndex])

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewSong(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddSong = async () => {
    if (!newSong.title.trim() || !newSong.artist.trim() || !newSong.user) return

    try {
      const songData = {
        ...newSong
      }

      const data = await musicService.add(songData)
      // Backend now returns song directly, not wrapped in song property
      if (data && data.title) {
        setSongs(prev => [data, ...prev])
        setNewSong({
          title: '',
          artist: '',
          story: '',
          url: '',
          user: ''
        })
        setView('playlist')
      }
    } catch (error) {
      console.error('Error saving song:', error)
    }
  }

  const getURLType = (url) => {
    if (!url) return 'unknown';
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    } else if (url.includes('spotify.com')) {
      return 'spotify';
    } else if (url.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/i)) {
      return 'audio';
    } else {
      return 'unknown';
    }
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const extractSpotifyId = (url) => {
    // Spotify URLs can be in different formats:
    // https://open.spotify.com/track/450pIumGxo4gf8bVXj4NKN
    // https://open.spotify.com/embed/track/450pIumGxo4gf8bVXj4NKN
    const regExp = /spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;
    const match = url.match(regExp);
    return match ? match[2] : null;
  };

  const fetchAlbumArt = async (song) => {
    // For now, we'll use a placeholder image
    // In a real implementation, you would use an API like Spotify or YouTube Data API
    const urlType = getURLType(song.url);
    
    if (urlType === 'youtube') {
      const videoId = extractYouTubeId(song.url);
      if (videoId) {
        // YouTube thumbnail URL
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } else if (urlType === 'spotify') {
      // For Spotify, we would need to use their API with authentication
      // For now, we'll use a placeholder
      return 'https://placehold.co/300x300/667eea/white?text=Spotify';
    } else if (song.title && song.artist) {
      // For other songs, we could use a service like Last.fm or iTunes API
      // For now, we'll use a placeholder
      return 'https://placehold.co/300x300/667eea/white?text=Album+Art';
    }
    
    // Default placeholder
    return 'https://placehold.co/300x300/667eea/white?text=No+Artwork';
  };

  const playSong = async (index) => {
    const song = songs[index];
    const urlType = getURLType(song.url);
    
    // Fetch album artwork
    const artUrl = await fetchAlbumArt(song);
    setAlbumArt(artUrl);
    
    if (urlType === 'audio') {
      // Handle direct audio files with HTML5 audio element
      if (currentSongIndex === index) {
        // Toggle play/pause for the same song
        setIsPlaying(!isPlaying);
      } else {
        // Play a different song
        setCurrentSongIndex(index);
        setIsPlaying(true);
        setShowEmbed(false); // Hide embed for audio files
      }
    } else {
      // Handle YouTube and Spotify links by embedding
      if (song.url) {
        setCurrentSongIndex(index);
        setShowEmbed(true); // Show embed for external links
      }
    }
  };

  const playNext = () => {
    if (songs.length > 0) {
      const nextIndex = (currentSongIndex + 1) % songs.length
      setCurrentSongIndex(nextIndex)
      setIsPlaying(true)
    }
  }

  const playPrevious = () => {
    if (songs.length > 0) {
      const prevIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1
      setCurrentSongIndex(prevIndex)
      setIsPlaying(true)
    }
  }

  const deleteSong = async (id) => {
    try {
      await musicService.delete(id)
      setSongs(prev => {
        const newSongs = prev.filter(song => song._id !== id)
        // If we're deleting the currently playing song, stop playback
        if (currentSongIndex >= 0 && prev[currentSongIndex]?._id === id) {
          setIsPlaying(false)
          setCurrentSongIndex(-1)
        }
        return newSongs
      })
    } catch (error) {
      console.error('Error deleting song:', error)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const currentSong = currentSongIndex >= 0 ? songs[currentSongIndex] : null

  return (
    <div className="music-player-container">
      <div className="music-player-header">
        <h2 className="music-player-title">💕 Şarkılarımız 💕</h2>
        <p className="music-player-subtitle">Birlikte dinlediğimiz şarkıları ve hikayelerini saklayalım</p>
      </div>

      <div className="music-player-tabs">
        <button 
          className={`music-tab ${view === 'playlist' ? 'active' : ''}`}
          onClick={() => setView('playlist')}
        >
          Çalma Listesi
        </button>
        <button 
          className={`music-tab ${view === 'add' ? 'active' : ''}`}
          onClick={() => setView('add')}
        >
          Şarkı Ekle
        </button>
      </div>

      {view === 'add' && (
        <div className="add-song-section">
          <h3>Yeni Şarkı Ekle</h3>
          <div className="add-song-form">
            <input
              type="text"
              name="title"
              placeholder="Şarkı adı..."
              value={newSong.title}
              onChange={handleInputChange}
              className="music-input"
            />
            
            <input
              type="text"
              name="artist"
              placeholder="Sanatçı..."
              value={newSong.artist}
              onChange={handleInputChange}
              className="music-input"
            />
            
            <input
              type="text"
              name="url"
              placeholder="Şarkı bağlantısı (YouTube, Spotify, vb.)..."
              value={newSong.url}
              onChange={handleInputChange}
              className="music-input"
            />
            
            <textarea
              name="story"
              placeholder="Bu şarkının bizim için özel hikayesi nedir?..."
              value={newSong.story}
              onChange={handleInputChange}
              className="music-textarea"
              rows="4"
            />
            
            <div className="user-selection">
              <h4>Kim Ekliyor?</h4>
              <div className="user-options">
                <button
                  className={`user-option ${newSong.user === 'user1' ? 'selected' : ''}`}
                  onClick={() => setNewSong({...newSong, user: 'user1'})}
                >
                  <span className="user-emoji">👩</span>
                  <span className="user-label">Sen</span>
                </button>
                <button
                  className={`user-option ${newSong.user === 'user2' ? 'selected' : ''}`}
                  onClick={() => setNewSong({...newSong, user: 'user2'})}
                >
                  <span className="user-emoji">👨</span>
                  <span className="user-label">Aşkım</span>
                </button>
              </div>
            </div>
            
            <button
              className="music-add-btn"
              onClick={handleAddSong}
              disabled={!newSong.title.trim() || !newSong.artist.trim() || !newSong.user}
            >
              Şarkıyı Ekle 💖
            </button>
          </div>
        </div>
      )}

      {view === 'playlist' && (
        <div className="playlist-section">
          {songs.length === 0 ? (
            <p className="no-songs">Henüz şarkı eklenmemiş</p>
          ) : (
            <>
              <div className="current-song-player">
                {currentSong && (
                  <div className="current-song-display">
                    {/* Album Artwork */}
                    <div className="album-art-container">
                      <img
                        src={albumArt || 'https://placehold.co/300x300/667eea/white?text=Album+Art'}
                        alt="Album Artwork"
                        className="album-art"
                      />
                    </div>
                    
                    <div className="current-song-info">
                      <h3 className="current-song-title">{currentSong.title}</h3>
                      <p className="current-song-artist">{currentSong.artist}</p>
                      {currentSong.story && (
                        <p className="current-song-story">{currentSong.story}</p>
                      )}
                      {currentSong.url && (
                        <p className="current-song-url-type">
                          {getURLType(currentSong.url) === 'youtube' && '▶️ YouTube Link'}
                          {getURLType(currentSong.url) === 'spotify' && '▶️ Spotify Link'}
                          {getURLType(currentSong.url) === 'audio' && '▶️ Audio File'}
                          {getURLType(currentSong.url) === 'unknown' && '▶️ External Link'}
                        </p>
                      )}
                    </div>
                    
                    {/* Embedded Player */}
                    {showEmbed && currentSong.url && (
                      <div className="embedded-player">
                        {getURLType(currentSong.url) === 'youtube' && (
                          <iframe
                            className="youtube-embed"
                            src={`https://www.youtube.com/embed/${extractYouTubeId(currentSong.url)}?autoplay=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        )}
                        {getURLType(currentSong.url) === 'spotify' && (
                          <iframe
                            className="spotify-embed"
                            src={`https://open.spotify.com/embed/track/${extractSpotifyId(currentSong.url)}`}
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                          ></iframe>
                        )}
                      </div>
                    )}
                    
                    {getURLType(currentSong.url) === 'audio' ? (
                      // Show player controls for audio files
                      <div className="player-controls">
                        <button className="player-btn" onClick={playPrevious}>
                          ⏮️
                        </button>
                        <button
                          className="player-btn play-pause-btn"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? '⏸️' : '▶️'}
                        </button>
                        <button className="player-btn" onClick={playNext}>
                          ⏭️
                        </button>
                      </div>
                    ) : (
                      // Show play button for external links
                      <div className="player-controls">
                        <button
                          className="player-btn play-pause-btn"
                          onClick={() => playSong(currentSongIndex)}
                        >
                          ▶️ Play
                        </button>
                      </div>
                    )}
                    
                    {getURLType(currentSong.url) === 'audio' && (
                      <div className="volume-control">
                        <span>🔈</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={volume}
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="volume-slider"
                        />
                        <span>🔊</span>
                      </div>
                    )}
                  </div>
                )}
                
                {currentSong && getURLType(currentSong.url) === 'audio' && (
                  <audio
                    ref={audioRef}
                    src={currentSong.url}
                    onEnded={playNext}
                  />
                )}
              </div>
              
              <div className="songs-list">
                <h3>Şarkı Listesi</h3>
                <div className="songs-list-container">
                  {songs.map((song, index) => (
                    <div
                      key={song._id}
                      className={`song-item ${currentSongIndex === index ? 'playing' : ''}`}
                    >
                      <div className="song-info" onClick={() => playSong(index)}>
                        <div className="song-play-indicator">
                          {getURLType(song.url) === 'audio' ? (
                            currentSongIndex === index && isPlaying ? '⏸️' : '▶️'
                          ) : (
                            '▶️'
                          )}
                        </div>
                        <div className="song-details">
                          <h4 className="song-title">{song.title}</h4>
                          <p className="song-artist">{song.artist}</p>
                          <p className="song-user">
                            {song.userId && song.userId.profile && song.userId.profile.gender ?
                              (song.userId.profile.gender === 'user1' ? '👩 Sen' : '👨 Aşkım') :
                              '👤 Kullanıcı'}
                          </p>
                          <p className="song-url-type">
                            {getURLType(song.url) === 'youtube' && 'YouTube'}
                            {getURLType(song.url) === 'spotify' && 'Spotify'}
                            {getURLType(song.url) === 'audio' && 'Audio'}
                            {getURLType(song.url) === 'unknown' && 'Link'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="song-actions">
                        <button 
                          className="song-action-btn"
                          onClick={() => {
                            setNewSong({
                              title: song.title,
                              artist: song.artist,
                              story: song.story,
                              url: song.url
                            })
                            setView('add')
                          }}
                        >
                          Düzenle
                        </button>
                        <button
                          className="song-action-btn delete-btn"
                          onClick={() => deleteSong(song._id)}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default MusicPlayer