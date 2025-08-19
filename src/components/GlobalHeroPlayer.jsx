import { useMemo } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import YouTubePlayer from './YouTubePlayer';
import './GlobalHeroPlayer.css';
import { useNavigate } from 'react-router-dom';

const GlobalHeroPlayer = ({ onClose }) => {
  const {
    currentSong,
    isPlaying,
    progress,
    currentTime,
    duration,
    currentVideoId,
    playerType,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    handleYouTubeReady,
    handleYouTubeStateChange,
  } = usePlayer();

  const navigate = useNavigate();

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const displayTitle = useMemo(
    () => currentSong?.title || 'Bilinmeyen Şarkı',
    [currentSong]
  );
  const displaySubtitle = useMemo(
    () => currentSong?.artist || 'SoundCloud playlist',
    [currentSong]
  );

  const onProgressClick = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newPercent = Math.min(1, Math.max(0, clickX / rect.width));
    seekTo(newPercent * duration);
  };

  // Boş durum: currentSong yoksa (metadata veya videoId durumuna bakmadan) boş görünüm göster
  const showEmpty = !currentSong;

  if (showEmpty) {
    return (
      <div className="global-hero-player">
        <button className="gh-close-btn" aria-label="Kapat" onClick={onClose}>×</button>
        <div className="empty-state">
          <button
            className="gh-btn"
            onClick={() => { navigate('/music-playlist'); onClose?.(); }}
            style={{ marginTop: 12 }}
          >
            Müzik çalara git
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="global-hero-wrapper">
      {/* YouTube global instance (hidden) */}
      <YouTubePlayer
        videoId={playerType === 'youtube' ? currentVideoId : null}
        onReady={handleYouTubeReady}
        onStateChange={handleYouTubeStateChange}
        autoplay={true}
        controls={false}
      />

      <div className="global-hero-player">
        {/* Close button inside player */}
        <button className="gh-close-btn" aria-label="Kapat" onClick={onClose}>×</button>

        {/* Title & Subtitle */}
        <h2 className="gh-title gh-title-spaced">{displayTitle}</h2>
        <p className="gh-subtitle gh-subtitle-spaced">{displaySubtitle}</p>

        {/* Progress Bar */}
        <div className="gh-progress gh-progress-spaced" onClick={onProgressClick}>
          <div className="gh-progress-track">
            <div
              className="gh-progress-fill"
              style={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }}
            />
          </div>
          <div className="gh-time-row">
            <span>{formatTime(currentTime || 0)}</span>
            <span>{formatTime(duration || 0)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="gh-controls">
          <button className="gh-btn" onClick={playPrevious} title="Previous">⏮</button>
          <button
            className={`gh-btn gh-play ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="gh-btn" onClick={playNext} title="Next">⏭</button>
        </div>
      </div>
    </div>
  );
};

export default GlobalHeroPlayer;