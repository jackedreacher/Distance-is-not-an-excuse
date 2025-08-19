import { } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import YouTubePlayer from './YouTubePlayer';
import './MiniPlayer.css';

const MiniPlayer = () => {
  const {
    currentSong,
    isPlaying,
    volume,
    progress,
    currentTime,
    duration,
    playerType,
    currentVideoId,
    miniPlayerVisible,
    isExpanded,
    setIsExpanded,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setPlayerVolume,
    hideMiniPlayer,
    handleYouTubeReady,
    handleYouTubeStateChange
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

  if (!miniPlayerVisible || !currentSong) {
    return null;
  }

  return (
    <div className={`mini-player ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* YouTube Player (hidden) */}
      {playerType === 'youtube' && currentVideoId && (
        <div style={{ display: 'none' }}>
          <YouTubePlayer
            videoId={currentVideoId}
            onReady={handleYouTubeReady}
            onStateChange={handleYouTubeStateChange}
            autoplay={true}
          />
        </div>
      )}

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