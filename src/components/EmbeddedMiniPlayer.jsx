import { useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
// Removed: import YouTubePlayer from './YouTubePlayer';
import './EmbeddedMiniPlayer.css';

const EmbeddedMiniPlayer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    currentSong,
    isPlaying,
    volume,
    progress,
    currentTime,
    duration,
    // Removed: playerType,
    // Removed: currentVideoId,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setPlayerVolume,
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

  if (!currentSong) {
    return null;
  }

  return (
    <div className={`embedded-mini-player ${isExpanded ? 'expanded' : 'compact'}`}>
      {/* Removed internal YouTubePlayer. We now rely on the global instance mounted in GlobalHeroPlayer */}

      {/* Compact Player Content */}
      <div className="embedded-player-content">
        {/* Song Info */}
        <div className="embedded-player-info" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="song-title-compact">{currentSong.title}</div>
          <div className="song-artist-compact">{currentSong.artist}</div>
        </div>

        {/* Controls */}
        <div className="embedded-player-controls">
          <button 
            className="control-btn-compact previous" 
            onClick={playPrevious}
            title="Önceki Şarkı"
          >
            ⏮️
          </button>
          
          <button 
            className="control-btn-compact play-pause" 
            onClick={togglePlay}
            title={isPlaying ? 'Durdur' : 'Çal'}
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          
          <button 
            className="control-btn-compact next" 
            onClick={playNext}
            title="Sonraki Şarkı"
          >
            ⏭️
          </button>
        </div>

        {/* Expand Toggle */}
        <button 
          className="expand-toggle" 
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? 'Küçült' : 'Genişlet'}
        >
          {isExpanded ? '🔽' : '🔼'}
        </button>
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="embedded-player-expanded">
          {/* Progress Bar */}
          <div className="progress-section-embedded">
            <span className="time-display-embedded">{formatTime(currentTime)}</span>
            <div 
              className="progress-bar-container-embedded" 
              onClick={handleProgressClick}
            >
              <div className="progress-bar-embedded">
                <div 
                  className="progress-fill-embedded" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <span className="time-display-embedded">{formatTime(duration)}</span>
          </div>

          {/* Volume Control */}
          <div className="volume-section-embedded">
            <span className="volume-icon-embedded">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider-embedded"
            />
            <span className="volume-display-embedded">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbeddedMiniPlayer;