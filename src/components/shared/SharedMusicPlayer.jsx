import React, { useState, useEffect } from 'react';
import { musicService } from '../../services/api';

import { useSocket } from '../../hooks/useSocket';
import './SharedMusicPlayer.css';

const SharedMusicPlayer = ({ channelId }) => {
    // Use demo user for shared component
    const user = { id: 'demo-user', name: 'Demo User' };
    const { socket } = useSocket();
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newSong, setNewSong] = useState({
    title: '',
    artist: '',
    story: ''
  });
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerTypingTimeout, setPartnerTypingTimeout] = useState(null);

  // Fetch songs for the channel
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const channelSongs = await musicService.getSongsByChannel(channelId);
        setSongs(channelSongs);
        
        // Set first song as current if exists
        if (channelSongs.length > 0 && !currentSong) {
          setCurrentSong(channelSongs[0]);
        }
        
        setError(null);
      } catch (err) {
        setError('Şarkı listesi yüklenemedi');
        console.error('Error fetching songs:', err);
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      fetchSongs();
    }
  }, [channelId, currentSong]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new songs
    socket.on('songAdded', (newSong) => {
      setSongs(prevSongs => [newSong, ...prevSongs]);
    });

    // Listen for song updates (play/pause)
    socket.on('songUpdated', (updatedSong) => {
      if (updatedSong._id === currentSong?._id) {
        setCurrentSong(updatedSong);
      }
    });

    // Listen for typing indicators
    socket.on('musicTyping', ({ userId, isTyping }) => {
      if (userId !== user.id) {
        setPartnerTyping(isTyping);
        
        // Clear any existing timeout
        if (partnerTypingTimeout) {
          clearTimeout(partnerTypingTimeout);
        }
        
        // Set timeout to clear typing indicator
        if (isTyping) {
          const timeout = setTimeout(() => {
            setPartnerTyping(false);
          }, 3000);
          setPartnerTypingTimeout(timeout);
        }
      }
    });

    // Listen for partner presence
    socket.on('partnerJoined', () => {
      console.log('Partner joined the music channel');
    });

    socket.on('partnerLeft', () => {
      console.log('Partner left the music channel');
      setPartnerTyping(false);
    });

    // Join the music channel
    if (channelId) {
      socket.emit('joinChannel', { channelId, userId: user.id });
    }

    // Cleanup
    return () => {
      socket.off('songAdded');
      socket.off('songUpdated');
      socket.off('musicTyping');
      socket.off('partnerJoined');
      socket.off('partnerLeft');
      
      // Leave the channel
      if (channelId) {
        socket.emit('leaveChannel', { channelId, userId: user.id });
      }
      
      // Clear timeout
      if (partnerTypingTimeout) {
        clearTimeout(partnerTypingTimeout);
      }
    };
  }, [socket, channelId, user.id, currentSong, partnerTypingTimeout]);

  // Handle song submission
  const handleSubmitSong = async (e) => {
    e.preventDefault();
    
    if (!newSong.title.trim() || !newSong.artist.trim()) {
      setError('Lütfen şarkı adı ve sanatçı bilgisi girin');
      return;
    }
    
    try {
      const songData = {
        title: newSong.title.trim(),
        artist: newSong.artist.trim(),
        story: newSong.story.trim(),
        channelId: channelId
      };
      
      const newSongResponse = await musicService.createSong(songData);
      
      // Emit socket event for real-time update
      socket.emit('addSong', newSongResponse);
      
      // Clear form
      setNewSong({
        title: '',
        artist: '',
        story: ''
      });
      setError(null);
    } catch (err) {
      setError('Şarkı eklenemedi');
      console.error('Error submitting song:', err);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (socket) {
      socket.emit('musicTyping', { channelId, userId: user.id, isTyping: true });
    }
  };

  // Handle typing stop
  const handleTypingStop = () => {
    if (socket) {
      socket.emit('musicTyping', { channelId, userId: user.id, isTyping: false });
    }
  };

  // Play a song
  const playSong = (song) => {
    setCurrentSong(song);
    setIsPlaying(true);
    
    // Emit socket event for real-time update
    socket.emit('updateSong', { ...song, isPlaying: true });
  };

  // Pause current song
  const pauseSong = () => {
    setIsPlaying(false);
    if (currentSong) {
      // Emit socket event for real-time update
      socket.emit('updateSong', { ...currentSong, isPlaying: false });
    }
  };

  // Delete a song
  const deleteSong = async (songId) => {
    try {
      await musicService.deleteSong(songId);
      
      // Remove from local state
      setSongs(prevSongs => prevSongs.filter(song => song._id !== songId));
      
      // If deleted song was current song, clear it
      if (currentSong?._id === songId) {
        setCurrentSong(null);
        setIsPlaying(false);
      }
      
      // Emit socket event for real-time update
      socket.emit('deleteSong', songId);
    } catch (err) {
      setError('Şarkı silinemedi');
      console.error('Error deleting song:', err);
    }
  };

  if (loading) {
    return (
      <div className="shared-music-player">
        <div className="music-loading">Müzik listesi yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="shared-music-player">
      <h2 className="music-title">Birlikte Dinlediğimiz Şarkılar</h2>
      
      {error && (
        <div className="music-error">{error}</div>
      )}
      
      {/* Current song player */}
      {currentSong && (
        <div className="current-song-player">
          <div className="current-song-display">
            <div className="current-song-info">
              <h3 className="current-song-title">{currentSong.title}</h3>
              <p className="current-song-artist">{currentSong.artist}</p>
              {currentSong.story && (
                <p className="current-song-story">"{currentSong.story}"</p>
              )}
            </div>
            
            <div className="player-controls">
              <button 
                className="player-btn play-pause-btn"
                onClick={isPlaying ? pauseSong : () => playSong(currentSong)}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add new song form */}
      <div className="add-song-section">
        <h3 className="add-song-title">Yeni Şarkı Ekle</h3>
        
        <form className="add-song-form" onSubmit={handleSubmitSong}>
          <input
            type="text"
            className="song-input"
            placeholder="Şarkı adı"
            value={newSong.title}
            onChange={(e) => setNewSong({...newSong, title: e.target.value})}
            onFocus={handleTyping}
            onBlur={handleTypingStop}
          />
          
          <input
            type="text"
            className="song-input"
            placeholder="Sanatçı"
            value={newSong.artist}
            onChange={(e) => setNewSong({...newSong, artist: e.target.value})}
            onFocus={handleTyping}
            onBlur={handleTypingStop}
          />
          
          <textarea
            className="song-textarea"
            placeholder="Bu şarkıyı neden sevdik? (isteğe bağlı)"
            value={newSong.story}
            onChange={(e) => setNewSong({...newSong, story: e.target.value})}
            onFocus={handleTyping}
            onBlur={handleTypingStop}
            maxLength={280}
          />
          
          <button type="submit" className="song-submit-btn">
            Şarkı Ekle
          </button>
          
          {partnerTyping && (
            <div className="partner-typing">
              🎵 Partnerin şarkı ekliyor...
            </div>
          )}
        </form>
      </div>
      
      {/* Song list */}
      <div className="songs-list">
        <h3 className="songs-list-title">Şarkı Listemiz</h3>
        
        {songs.length === 0 ? (
          <div className="no-songs">Henüz şarkı eklenmemiş</div>
        ) : (
          <div className="songs-container">
            {songs.map((song) => (
              <div key={song._id} className="song-item">
                <div className="song-info" onClick={() => playSong(song)}>
                  <div className="song-details">
                    <h4 className="song-title">{song.title}</h4>
                    <p className="song-artist">{song.artist}</p>
                  </div>
                </div>
                
                <div className="song-actions">
                  <button 
                    className="song-action-btn play-btn"
                    onClick={() => playSong(song)}
                  >
                    ▶️
                  </button>
                  <button 
                    className="song-action-btn delete-btn"
                    onClick={() => deleteSong(song._id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedMusicPlayer;