import { useState, useEffect, useRef } from 'react'
import { musicService } from '../services/api'
import youtubeApi from '../services/youtubeApi'
import YouTubePlayer from './YouTubePlayer'
import DraggableProgressBar from './DraggableProgressBar'

const MusicPlayer = () => {
  const [songs, setSongs] = useState([])
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    story: '',
    url: '',
    user: ''
  })
  const [currentSongIndex, setCurrentSongIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [view, setView] = useState('playlist')
  const [albumArt, setAlbumArt] = useState('')
  const [audioProgress, setAudioProgress] = useState(0)
  const [musicCurrentTime, setMusicCurrentTime] = useState('00 : 00')
  const [musicTotalLength, setMusicTotalLength] = useState('00 : 00')
  const [avatarClassIndex, setAvatarClassIndex] = useState(0)
  
  // YouTube API states
  const [youtubeSearchResults, setYoutubeSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showYouTubeSearch, setShowYouTubeSearch] = useState(false)
  
  // YouTube Player states
  const [youtubePlayer, setYoutubePlayer] = useState(null)
  const [isYouTubeVideo, setIsYouTubeVideo] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState('')
  
  const audioRef = useRef(null)
  const youtubePlayerRef = useRef(null)
  
  // Avatar animation classes
  const avatarClass = ['objectFitCover', 'objectFitContain', 'none']


  // Load songs from API on component mount
  useEffect(() => {
    const loadSongs = async () => {
      try {
        // Load songs directly without authentication
        
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
  }, [])

  // Handle audio event listeners only
  useEffect(() => {
    if (audioRef.current && currentSongIndex >= 0) {
      const audio = audioRef.current
      
      // Add event listeners for time updates and metadata
      const handleTimeUpdate = () => {
        // Time update is now handled by handleAudioUpdate
      }
      
      const handleLoadedMetadata = () => {
        console.log('Audio metadata loaded, duration:', audio.duration)
      }
      
      const handleCanPlay = () => {
        console.log('Audio can start playing')
      }
      
      const handleError = (e) => {
        console.error('Audio error:', e)
        setIsPlaying(false)
      }
      
      audio.addEventListener('timeupdate', handleTimeUpdate)
      audio.addEventListener('loadedmetadata', handleLoadedMetadata)
      audio.addEventListener('canplay', handleCanPlay)
      audio.addEventListener('error', handleError)
      
      // Cleanup event listeners
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate)
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
        audio.removeEventListener('canplay', handleCanPlay)
        audio.removeEventListener('error', handleError)
      }
    }
  }, [currentSongIndex])

  // Handle volume change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      console.log('Volume set to:', volume)
      console.log('Audio element volume:', audioRef.current.volume)
      console.log('Audio element muted:', audioRef.current.muted)
    }
  }, [volume])
  
  // Handle avatar class change
  const handleAvatar = () => {
    if (avatarClassIndex >= avatarClass.length - 1) {
      setAvatarClassIndex(0)
    } else {
      setAvatarClassIndex(avatarClassIndex + 1)
    }
  }
  

  
  // Handle audio update for progress and time display
  const handleAudioUpdate = () => {
    if (audioRef.current) {
      // Input total length of the audio
      let minutes = Math.floor(audioRef.current.duration / 60)
      let seconds = Math.floor(audioRef.current.duration % 60)
      let musicTotalLength0 = `${minutes < 10 ? `0${minutes}` : minutes} : ${seconds < 10 ? `0${seconds}` : seconds}`
      setMusicTotalLength(musicTotalLength0)
      
      // Input Music Current Time
      let currentMin = Math.floor(audioRef.current.currentTime / 60)
      let currentSec = Math.floor(audioRef.current.currentTime % 60)
      let musicCurrentT = `${currentMin < 10 ? `0${currentMin}` : currentMin} : ${currentSec < 10 ? `0${currentSec}` : currentSec}`
      setMusicCurrentTime(musicCurrentT)
      
      const progress = parseInt((audioRef.current.currentTime / audioRef.current.duration) * 100)
      setAudioProgress(isNaN(progress) ? 0 : progress)
    }
  }

  // Test audio context and user interaction
  const testAudio = () => {
    console.log('🔊 SES TESTİ BAŞLATILDI!');
    console.log('audioRef.current:', audioRef.current);
    console.log('currentSongIndex:', currentSongIndex);
    console.log('songs length:', songs.length);
    
    // If there are songs available, try to play the first audio song
    if (songs.length > 0) {
      const audioSongs = songs.filter(song => getURLType(song.url) === 'audio');
      if (audioSongs.length > 0) {
        console.log('🎵 Playing first audio song for test');
        const firstAudioIndex = songs.findIndex(song => getURLType(song.url) === 'audio');
        playSong(firstAudioIndex);
        return;
      }
    }
    
    if (audioRef.current) {
      console.log('=== AUDIO TEST ===');
      console.log('Audio src:', audioRef.current.src);
      console.log('Audio volume:', audioRef.current.volume);
      console.log('Audio muted:', audioRef.current.muted);
      console.log('Audio paused:', audioRef.current.paused);
      console.log('Audio readyState:', audioRef.current.readyState);
      console.log('Audio duration:', audioRef.current.duration);
      console.log('Audio currentTime:', audioRef.current.currentTime);
      
      // Try to play with user interaction
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('✅ Audio test successful - sound should be playing');
        }).catch(e => {
          console.error('❌ Audio test failed:', e);
        });
      }
    } else {
      console.log('❌ audioRef.current is null - no audio element found');
      
      // Try to create a test audio element
      const testAudioElement = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.wav');
      testAudioElement.volume = 0.5;
      testAudioElement.play().then(() => {
        console.log('✅ Test audio played successfully');
      }).catch(e => {
        console.error('❌ Test audio failed:', e);
      });
    }
  };

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

  // YouTube API functions
  const searchYouTubeMusic = async (query) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await youtubeApi.searchMusic(query, 20);
      setYoutubeSearchResults(results);
    } catch (error) {
      console.error('YouTube arama hatası:', error);
      alert('YouTube arama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectYouTubeTrack = (track) => {
    setNewSong({
      ...newSong,
      title: track.title,
      artist: track.artist,
      url: track.url
    });
    setShowYouTubeSearch(false);
    setYoutubeSearchResults([]);
    setSearchQuery('');
  };

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchYouTubeMusic(searchQuery);
  };

  // YouTube Player event handlers
  const handleYouTubeReady = (playerControls) => {
    setYoutubePlayer(playerControls);
  };

  const handleYouTubeStateChange = (event) => {
    // YouTube Player States:
    // -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    const state = event.data;
    
    if (state === 1) { // Playing
      setIsPlaying(true);
    } else if (state === 2 || state === 0) { // Paused or Ended
      setIsPlaying(false);
    }
    
    if (state === 0) { // Ended
      playNext(); // Auto-play next song
    }
  };

  // Toggle play/pause for YouTube videos
  const toggleYouTubePlayback = () => {
    if (youtubePlayer) {
      if (isPlaying) {
        youtubePlayer.pause();
      } else {
        youtubePlayer.play();
      }
    }
  };

  // Update YouTube volume
  const updateYouTubeVolume = (newVolume) => {
    if (youtubePlayer) {
      youtubePlayer.setVolume(newVolume * 100); // YouTube expects 0-100
    }
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
        if (audioRef.current) {
          if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
          } else {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                setIsPlaying(true);
                console.log('Audio started playing successfully');
              }).catch(e => {
                console.log("Playback failed:", e);
                setIsPlaying(false);
              });
            }
          }
        }
      } else {
        // Play a different song
        setCurrentSongIndex(index);
        // Reset current time handled by handleAudioUpdate; // Reset time
        
        // Wait for the next render cycle to ensure audio element is updated
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.load();
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                setIsPlaying(true);
                console.log('New song started playing successfully');
              }).catch(e => {
                console.log("Playback failed:", e);
                setIsPlaying(false);
              });
            }
          }
        }, 100);
      }
    } else if (urlType === 'youtube') {
      // Handle YouTube videos
      const videoId = extractYouTubeId(song.url);
      if (videoId) {
        setCurrentSongIndex(index);
        setCurrentVideoId(videoId);
        setIsYouTubeVideo(true);
        setIsPlaying(false); // Will be set to true when YouTube player starts
      }
    } else {
      // Handle other types (Spotify, etc.)
      if (song.url) {
        setCurrentSongIndex(index);
        setIsYouTubeVideo(false);
        setIsPlaying(false); // Don't auto-play embeds
      }
    }
  };

  const playNext = () => {
    if (songs.length > 0) {
      const nextIndex = (currentSongIndex + 1) % songs.length
      playSong(nextIndex)
    }
  }

  const playPrevious = () => {
    if (songs.length > 0) {
      const prevIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1
      playSong(prevIndex)
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





  // This useEffect is now handled in the main audio playback useEffect above

  const currentSong = currentSongIndex >= 0 ? songs[currentSongIndex] : null

  return (
    <div className="spotify-player">
      {/* Header */}
      <div className="spotify-header">
        <h1 className="spotify-title">💕 Şarkılarımız</h1>
        <p className="spotify-subtitle">Birlikte dinlediğimiz şarkıları ve hikayelerini saklayalım</p>
      </div>

      {/* Navigation Tabs */}
      <div className="spotify-nav">
        <button 
          className={`spotify-nav-btn ${view === 'playlist' ? 'active' : ''}`}
          onClick={() => setView('playlist')}
        >
          <span className="nav-icon">🎵</span>
          Çalma Listesi
        </button>
        <button 
          className={`spotify-nav-btn ${view === 'add' ? 'active' : ''}`}
          onClick={() => setView('add')}
        >
          <span className="nav-icon">➕</span>
          Şarkı Ekle
        </button>
      </div>

      {/* Add Song View */}
      {view === 'add' && (
        <div className="spotify-add-section">
          <div className="add-form-container">
            <h2 className="add-form-title">Yeni Şarkı Ekle</h2>
            
            <div className="form-group">
              <label className="form-label">Şarkı Adı</label>
              <input
                type="text"
                name="title"
                placeholder="Şarkı adını girin..."
                value={newSong.title}
                onChange={handleInputChange}
                className="spotify-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Sanatçı</label>
              <input
                type="text"
                name="artist"
                placeholder="Sanatçı adını girin..."
                value={newSong.artist}
                onChange={handleInputChange}
                className="spotify-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Şarkı Bağlantısı</label>
              <div className="url-input-container">
                <input
                  type="text"
                  name="url"
                  placeholder="YouTube, Spotify veya diğer bağlantı..."
                  value={newSong.url}
                  onChange={handleInputChange}
                  className="spotify-input"
                />
                <button
                  type="button"
                  className="youtube-search-btn"
                  onClick={() => setShowYouTubeSearch(!showYouTubeSearch)}
                >
                  🔍 YouTube'da Ara
                </button>
              </div>
              
              {/* YouTube Search Modal */}
              {showYouTubeSearch && (
                <div className="youtube-search-modal">
                  <div className="youtube-search-header">
                    <h3>YouTube'da Müzik Ara</h3>
                    <button
                      className="close-search-btn"
                      onClick={() => setShowYouTubeSearch(false)}
                    >
                      ✕
                    </button>
                  </div>
                  
                  <form onSubmit={handleSearchSubmit} className="youtube-search-form">
                    <input
                      type="text"
                      placeholder="Şarkı veya sanatçı adı girin..."
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      className="youtube-search-input"
                    />
                    <button type="submit" className="youtube-search-submit" disabled={isSearching}>
                      {isSearching ? '🔄 Aranıyor...' : '🔍 Ara'}
                    </button>
                  </form>
                  
                  {/* Search Results */}
                  <div className="youtube-search-results">
                    {youtubeSearchResults.map((track, index) => (
                      <div key={index} className="youtube-track-item" onClick={() => selectYouTubeTrack(track)}>
                        <img src={track.thumbnail} alt={track.title} className="track-thumbnail" />
                        <div className="track-info">
                          <div className="track-title">{track.title}</div>
                          <div className="track-artist">{track.artist}</div>
                        </div>
                        <button className="select-track-btn">Seç</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Hikaye</label>
              <textarea
                name="story"
                placeholder="Bu şarkının bizim için özel hikayesi..."
                value={newSong.story}
                onChange={handleInputChange}
                className="spotify-textarea"
                rows="4"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Kim Ekliyor?</label>
              <div className="user-selector">
                <button
                  type="button"
                  className={`user-btn ${newSong.user === 'female' ? 'selected' : ''}`}
                  onClick={() => setNewSong({...newSong, user: 'female'})}
                >
                  <span className="user-avatar">👩</span>
                  <span>mermi</span>
                </button>
                <button
                  type="button"
                  className={`user-btn ${newSong.user === 'male' ? 'selected' : ''}`}
                  onClick={() => setNewSong({...newSong, user: 'male'})}
                >
                  <span className="user-avatar">👨</span>
                  <span>yusuf</span>
                </button>
                <button
                  type="button"
                  className={`user-btn ${newSong.user === 'other' ? 'selected' : ''}`}
                  onClick={() => setNewSong({...newSong, user: 'other'})}
                >
                  <span className="user-avatar">🧑</span>
                  <span>Diğer</span>
                </button>
              </div>
            </div>
            
            <button
              className="spotify-add-btn"
              onClick={handleAddSong}
              disabled={!newSong.title.trim() || !newSong.artist.trim() || !newSong.user}
            >
              <span className="btn-icon">💖</span>
              Şarkıyı Ekle
            </button>
          </div>
        </div>
      )}

      {/* Playlist View */}
      {view === 'playlist' && (
        <div className="spotify-main">
          {/* Current Song Player */}
          {currentSong && (
            <div className="now-playing">
              <div className="now-playing-content">
                <div className="album-art-section">
                  <div className="album-art-container">
                    <img
                      src={albumArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center'}
                      alt="Album Art"
                      className={`album-art ${avatarClass[avatarClassIndex]} animated-avatar`}
                      onClick={handleAvatar}
                    />
                    <div className="play-overlay">
                      <button 
                        className="play-overlay-btn"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? '⏸️' : '▶️'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="song-info-section">
                  <div className="song-meta">
                    <h2 className="current-title">{currentSong.title}</h2>
                    <p className="current-artist">{currentSong.artist}</p>
                    {currentSong.story && (
                      <p className="current-story">{currentSong.story}</p>
                    )}
                  </div>
                  
                  <div className="player-controls-section">
                    <div className="main-controls">
                      <button className="control-btn" onClick={playPrevious}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.588a.7.7 0 0 1-1.05.606L4 8.149V13.3a.7.7 0 0 1-1.4 0V1.7a.7.7 0 0 1 .7-.7z"/>
                        </svg>
                      </button>
                      
                      <button 
                        className="play-btn"
                        onClick={() => {
                          if (isYouTubeVideo) {
                            toggleYouTubePlayback();
                          } else {
                            setIsPlaying(!isPlaying);
                          }
                        }}
                      >
                        {isPlaying ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h2a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 9 14H7a1.5 1.5 0 0 1-1.5-1.5v-9z"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/>
                          </svg>
                        )}
                      </button>
                      
                      <button className="control-btn" onClick={playNext}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.588a.7.7 0 0 0 1.05.606L12 8.149V13.3a.7.7 0 0 0 1.4 0V1.7a.7.7 0 0 0-.7-.7z"/>
                        </svg>
                      </button>
                    </div>
                    
                    {getURLType(currentSong.url) === 'audio' && (
                      <div className="progress-section">
                        <DraggableProgressBar
                          value={audioProgress}
                          onChange={(value) => {
                            setAudioProgress(value);
                            if (audioRef.current) {
                              audioRef.current.currentTime = value * audioRef.current.duration / 100;
                            }
                          }}
                          min={0}
                          max={100}
                          label={`${musicCurrentTime} / ${musicTotalLength}`}
                          color="#87CEEB"
                          height={6}
                          showValue={false}
                        />
                      </div>
                    )}
                    
                    <div className="volume-section">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M10.717 3.55A.5.5 0 0 1 11 4v8a.5.5 0 0 1-.812.39L7.825 10.5H5.5A.5.5 0 0 1 5 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
                      </svg>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => {
                          const newVolume = parseFloat(e.target.value);
                          setVolume(newVolume);
                          if (isYouTubeVideo) {
                            updateYouTubeVolume(newVolume);
                          }
                        }}
                        className="volume-slider"
                      />
                      
                      {/* Audio Test Button */}
                      <button 
                        className="test-audio-btn"
                        onClick={testAudio}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#1db954',
                          color: 'white',
                          border: 'none',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginLeft: '10px'
                        }}
                      >
                        🔊 Ses Testi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Songs List */}
          <div className="songs-section">
            <div className="songs-header">
              <h3 className="songs-title">Şarkı Listesi</h3>
              <span className="songs-count">{songs.length} şarkı</span>
            </div>
            
            {songs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎵</div>
                <h3>Henüz şarkı yok</h3>
                <p>İlk şarkınızı ekleyerek başlayın!</p>
                <button 
                  className="empty-action-btn"
                  onClick={() => setView('add')}
                >
                  Şarkı Ekle
                </button>
              </div>
            ) : (
              <div className="songs-list">
                <div className="songs-list-header">
                  <div className="header-col header-number">#</div>
                  <div className="header-col header-title">Başlık</div>
                  <div className="header-col header-artist">Sanatçı</div>
                  <div className="header-col header-user">Ekleyen</div>
                  <div className="header-col header-actions">İşlemler</div>
                </div>
                
                <div className="songs-list-body">
                  {songs.map((song, index) => (
                    <div
                      key={song._id}
                      className={`song-row ${currentSongIndex === index ? 'active' : ''}`}
                      onClick={() => playSong(index)}
                    >
                      <div className="song-col song-number">
                        {currentSongIndex === index && isPlaying ? (
                          <div className="playing-indicator">
                            <div className="bar"></div>
                            <div className="bar"></div>
                            <div className="bar"></div>
                          </div>
                        ) : (
                          <span className="track-number">{index + 1}</span>
                        )}
                      </div>
                      
                      <div className="song-col song-title-col">
                        <div className="song-title">{song.title}</div>
                        {song.story && (
                          <div className="song-story">{song.story}</div>
                        )}
                      </div>
                      
                      <div className="song-col song-artist">{song.artist}</div>
                      
                      <div className="song-col song-user">
                        <span className="user-badge">
                          {song.userId && song.userId.profile && song.userId.profile.gender ?
                            (song.userId.profile.gender === 'female' ? '👩 mermi' : 
                             song.userId.profile.gender === 'male' ? '👨 yusuf' : 
                             '🧑 Diğer') :
                            '👤 Kullanıcı'}
                        </span>
                      </div>
                      
                      <div className="song-col song-actions">
                        <button 
                          className="action-btn edit-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            setNewSong({
                              title: song.title,
                              artist: song.artist,
                              story: song.story,
                              url: song.url
                            })
                            setView('add')
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L10.5 8.207l-3-3L12.146.146zM11.207 9l-3-3L2.5 11.707V13.5a.5.5 0 0 0 .5.5h1.793L11.207 9z"/>
                          </svg>
                        </button>
                        
                        <button
                          className="action-btn delete-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSong(song._id)
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Audio Element */}
      {currentSong && getURLType(currentSong.url) === 'audio' && (
        <audio
          ref={audioRef}
          src={currentSong.url}
          onEnded={playNext}
          onTimeUpdate={handleAudioUpdate}
          onLoadStart={() => {
            console.log('Audio load started');
            if (audioRef.current) {
              audioRef.current.volume = volume;
            }
          }}
          onCanPlay={() => {
            console.log('Audio can play');
            if (audioRef.current) {
              audioRef.current.volume = volume;
              console.log('Audio volume set to:', audioRef.current.volume);
              console.log('Audio muted:', audioRef.current.muted);
            }
          }}
          onPlay={() => {
            console.log('Audio started playing');
            if (audioRef.current) {
              audioRef.current.volume = volume;
              console.log('Current volume:', audioRef.current.volume);
            }
          }}
          onPause={() => console.log('Audio paused')}
          onError={(e) => {
            console.error('Audio error:', e);
            console.error('Audio src:', currentSong.url);
          }}
          preload="metadata"
          crossOrigin="anonymous"
        />
      )}
      
      {/* YouTube Player */}
      {currentSong && isYouTubeVideo && currentVideoId && (
        <YouTubePlayer
          ref={youtubePlayerRef}
          videoId={currentVideoId}
          onReady={handleYouTubeReady}
          onStateChange={handleYouTubeStateChange}
          volume={volume * 100}
        />
      )}
    </div>
  )
}

export default MusicPlayer