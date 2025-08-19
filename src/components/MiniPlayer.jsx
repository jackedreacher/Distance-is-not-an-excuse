import { } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
// Removed: import YouTubePlayer from './YouTubePlayer';
import './MiniPlayer.css';
import { Link } from 'react-router-dom';

const MiniPlayer = () => {
  const {
    currentSong,
    isPlaying,
    volume,
    progress,
    currentTime,
    duration,
    // Removed: playerType,
    // Removed: currentVideoId,
    miniPlayerVisible,
    isExpanded,
    setIsExpanded,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setPlayerVolume,
    hideMiniPlayer,
    // Removed: handleYouTubeReady,
    // Removed: handleYouTubeStateChange
  } = usePlayer();

  // Format time display
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle progress bar interaction
  const handleProgressClick = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = (clickX / rect.width) * 100;
    const newTime = (newProgress / 100) * duration;
    seekTo(newTime);
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setPlayerVolume(newVolume);
  };

  // Empty state: no song has been selected/played yet
  if (!currentSong) {
    return (
      <div className="mini-player empty">
        <div className="mini-player-content">
          <div className="mini-empty-icon">🎧</div>
          <div className="mini-empty-text">
            <div className="mini-empty-title">Henüz müzik açmadın</div>
            <div className="mini-empty-subtitle">Sevdiğimiz şarkılardan birini seçmek için müzik sayfasına gidelim</div>
          </div>
          <Link to="/music-playlist" className="mini-empty-btn">Müzik çalara git</Link>
        </div>
      </div>
    );
  }

  // Respect user choice to hide the mini-player when a song exists
  if (!miniPlayerVisible) {
    return null;
  }

  return (
    <div className={`mini-player ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Removed internal YouTubePlayer. Using global YouTube instance only. */}

      {/* Mini Player Content */}
      <div className="mini-player-content">
        {/* Song Info */}
        <div className="mini-player-info" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="song-title">{currentSong.title}</div>
          <div className="song-artist">{currentSong.artist}</div>
        </div>

        {/* Controls */}
        <div className="mini-player-controls">
          <button 
            className="control-btn previous" 
            onClick={playPrevious}
            title="Previous Song"
          >
            ⏮️
          </button>
          
          <button 
            className="control-btn play-pause" 
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <button 
            className="control-btn next" 
            onClick={playNext}
            title="Next Song"
          >
            ⏭️
          </button>
        </div>

        {/* Close Button */}
        <button 
          className="control-btn close" 
          onClick={hideMiniPlayer}
          title="Close Player"
        >
          ✕
        </button>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="mini-player-expanded">
          {/* Progress Bar */}
          <div className="progress-section">
            <span className="time-display">{formatTime(currentTime)}</span>
            <div 
              className="progress-bar-container" 
              onClick={handleProgressClick}
            >
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="time-display">{formatTime(duration)}</span>
          </div>

          {/* Volume Control */}
          <div className="volume-section">
            <span className="volume-icon">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
            <span className="volume-display">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniPlayer;