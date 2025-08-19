import { createContext, useContext, useState, useRef, useEffect } from 'react';

const PlayerContext = createContext();

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};

export const PlayerProvider = ({ children }) => {
  // Core player state
  const [songs, setSongs] = useState([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Player type and references
  const [playerType, setPlayerType] = useState('audio'); // 'audio' or 'youtube'
  const [youtubePlayer, setYoutubePlayer] = useState(null);
  const [currentVideoId, setCurrentVideoId] = useState('');
  
  // Mini player visibility
  const [miniPlayerVisible, setMiniPlayerVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Audio ref for direct audio files
  const audioRef = useRef(null);

  // Initialize audio element if it doesn't exist
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('ended', handleEnded);
      audioRef.current.addEventListener('error', handleError);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
      }
    };
  }, []);

  // Update volume whenever it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (youtubePlayer && playerType === 'youtube') {
      youtubePlayer.setVolume(volume * 100);
    }
  }, [volume, youtubePlayer, playerType]);

  // Utility functions
  const getURLType = (url) => {
    if (!url) return 'unknown';
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
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

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    playNext();
  };

  const handleError = (e) => {
    console.error('Audio error:', e);
    setIsPlaying(false);
  };

  // YouTube player handlers
  const handleYouTubeReady = (playerControls) => {
    setYoutubePlayer(playerControls);
  };

  // Track interval for YouTube time updates
  const youtubeTimerRef = useRef(null);

  const clearYouTubeTimer = () => {
    if (youtubeTimerRef.current) {
      clearInterval(youtubeTimerRef.current);
      youtubeTimerRef.current = null;
    }
  };

  const handleYouTubeStateChange = (evtOrState) => {
    const state = typeof evtOrState === 'number' ? evtOrState : evtOrState?.data;
    // YouTube Player States: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
    if (state === 1) { // Playing
      setIsPlaying(true);
      // Start polling current time/duration for progress
      clearYouTubeTimer();
      youtubeTimerRef.current = setInterval(() => {
        if (youtubePlayer) {
          const ct = youtubePlayer.getCurrentTime?.() ?? 0;
          const dur = youtubePlayer.getDuration?.() ?? 0;
          setCurrentTime(ct);
          setDuration(dur || 0);
          setProgress(dur ? (ct / dur) * 100 : 0);
        }
      }, 500);
    } else if (state === 2) { // Paused
      setIsPlaying(false);
      clearYouTubeTimer();
    } else if (state === 0) { // Ended
      setIsPlaying(false);
      clearYouTubeTimer();
      playNext();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearYouTubeTimer();
    };
  }, []);

  // Playback controls
  const playSong = async (index, songList = null) => {
    if (songList) {
      setSongs(songList);
    }
    
    const targetSongs = songList || songs;
    if (index < 0 || index >= targetSongs.length) return;

    const song = targetSongs[index];
    const urlType = getURLType(song.url);

    // Stop current playback
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (youtubePlayer) {
      youtubePlayer.pause();
    }

    setCurrentSongIndex(index);
    setPlayerType(urlType);
    setMiniPlayerVisible(true);

    if (urlType === 'audio') {
      audioRef.current.src = song.url;
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Failed to play audio:', error);
        setIsPlaying(false);
      }
    } else if (urlType === 'youtube') {
      const videoId = extractYouTubeId(song.url);
      setCurrentVideoId(videoId);
      
      if (youtubePlayer && videoId) {
        youtubePlayer.loadVideoById(videoId);
        youtubePlayer.play();
      }
    }
  };

  const togglePlay = () => {
    if (playerType === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(e => {
          console.error('Play failed:', e);
        });
      }
    } else if (playerType === 'youtube' && youtubePlayer) {
      if (isPlaying) {
        youtubePlayer.pause();
      } else {
        youtubePlayer.play();
      }
    }
  };

  const playNext = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentSongIndex + 1) % songs.length;
    playSong(nextIndex);
  };

  const playPrevious = () => {
    if (songs.length === 0) return;
    const prevIndex = currentSongIndex === 0 ? songs.length - 1 : currentSongIndex - 1;
    playSong(prevIndex);
  };

  const seekTo = (time) => {
    if (playerType === 'audio' && audioRef.current) {
      audioRef.current.currentTime = time;
    } else if (playerType === 'youtube' && youtubePlayer) {
      youtubePlayer.seekTo(time);
    }
  };

  const setPlayerVolume = (newVolume) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  };

  const hideMiniPlayer = () => {
    setMiniPlayerVisible(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (youtubePlayer) {
      youtubePlayer.pause();
    }
    setIsPlaying(false);
  };

  const currentSong = currentSongIndex >= 0 && currentSongIndex < songs.length ? songs[currentSongIndex] : null;

  const value = {
    // State
    songs,
    setSongs,
    currentSong,
    currentSongIndex,
    isPlaying,
    volume,
    progress,
    currentTime,
    duration,
    playerType,
    youtubePlayer,
    currentVideoId,
    miniPlayerVisible,
    isExpanded,
    setIsExpanded,
    
    // Controls
    playSong,
    togglePlay,
    playNext,
    playPrevious,
    seekTo,
    setPlayerVolume,
    hideMiniPlayer,
    
    // YouTube handlers
    handleYouTubeReady,
    handleYouTubeStateChange,
    
    // Refs
    audioRef
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};