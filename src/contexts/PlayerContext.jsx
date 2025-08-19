/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useRef, useEffect } from 'react';
import youtubeApi from '../services/youtubeApi';

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

  // --- Persistence: load from localStorage on mount ---
  useEffect(() => {
    try {
      const savedSongs = localStorage.getItem('player:songs');
      const savedIndex = localStorage.getItem('player:currentIndex');
      const savedType = localStorage.getItem('player:type');
      const savedVideoId = localStorage.getItem('player:ytVideoId');
      const savedVolume = localStorage.getItem('player:volume');

      if (savedSongs) setSongs(JSON.parse(savedSongs));
      if (savedIndex !== null) setCurrentSongIndex(parseInt(savedIndex, 10));
      if (savedType) setPlayerType(savedType);
      if (savedVideoId) setCurrentVideoId(savedVideoId);
      if (savedVolume !== null) setVolume(Math.max(0, Math.min(1, parseFloat(savedVolume))));
    } catch (e) {
      console.warn('Player state restore failed:', e);
    }
  }, []);

  // If we have a valid current song, show mini player after hydration
  useEffect(() => {
    if (currentSongIndex >= 0 && currentSongIndex < songs.length) {
      setMiniPlayerVisible(true);
    }
  }, [currentSongIndex, songs.length]);

  // --- Persistence: save to localStorage on changes ---
  useEffect(() => {
    try {
      localStorage.setItem('player:songs', JSON.stringify(songs));
    } catch (e) {
      console.warn('Persist songs failed:', e);
    }
  }, [songs]);

  useEffect(() => {
    try {
      localStorage.setItem('player:currentIndex', String(currentSongIndex));
    } catch (e) {
      console.warn('Persist current index failed:', e);
    }
  }, [currentSongIndex]);

  useEffect(() => {
    try {
      localStorage.setItem('player:type', playerType);
    } catch (e) {
      console.warn('Persist player type failed:', e);
    }
  }, [playerType]);

  useEffect(() => {
    try {
      localStorage.setItem('player:ytVideoId', currentVideoId || '');
    } catch (e) {
      console.warn('Persist video id failed:', e);
    }
  }, [currentVideoId]);

  useEffect(() => {
    try {
      localStorage.setItem('player:volume', String(volume));
    } catch (e) {
      console.warn('Persist volume failed:', e);
    }
  }, [volume]);

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
    // Player hazır olduğunda sesi mevcut seviyeye ayarla
    try {
      if (playerControls?.setVolume) {
        playerControls.setVolume(volume * 100);
      }
    } catch (e) {
      // sessizce yut: bazı tarayıcılarda hazır olmadan setVolume hata fırlatabilir
      void e;
    }
  };

  // Track interval for YouTube time updates
  const youtubeTimerRef = useRef(null);
  const youtubeMetaTimerRef = useRef(null);

  const clearYouTubeTimer = () => {
    if (youtubeTimerRef.current) {
      clearInterval(youtubeTimerRef.current);
      youtubeTimerRef.current = null;
    }
  };

  const clearYouTubeMetaTimer = () => {
    if (youtubeMetaTimerRef.current) {
      clearInterval(youtubeMetaTimerRef.current);
      youtubeMetaTimerRef.current = null;
    }
  };

  const handleYouTubeStateChange = (evtOrState) => {
    const state = typeof evtOrState === 'number' ? evtOrState : evtOrState?.data;
    if (import.meta.env.DEV) {
      console.debug('[YT] onStateChange:', state, {
        isPlaying,
        hasPlayer: !!youtubePlayer,
        ct: youtubePlayer?.getCurrentTime?.(),
        dur: youtubePlayer?.getDuration?.(),
      });
    }
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
      if (import.meta.env.DEV) console.debug('[YT] timer started via state=PLAYING');
    } else if (state === 2) { // Paused
      setIsPlaying(false);
      // Güncel değerleri bir kez çekerek UI'ı senkron tut
      if (youtubePlayer) {
        const ct = youtubePlayer.getCurrentTime?.() ?? 0;
        const dur = youtubePlayer.getDuration?.() ?? 0;
        setCurrentTime(ct);
        setDuration(dur || 0);
        setProgress(dur ? (ct / dur) * 100 : 0);
      }
      clearYouTubeTimer();
      if (import.meta.env.DEV) console.debug('[YT] timer cleared via state=PAUSED');
    } else if (state === 0) { // Ended
      setIsPlaying(false);
      clearYouTubeTimer();
      if (import.meta.env.DEV) console.debug('[YT] ended, playNext');
      playNext();
    } else if (state === 5 || state === 3) { // Cued or Buffering
      // Metadata hazır olana kadar kısa süreliğine duration'ı poll et
      if (!youtubeMetaTimerRef.current) {
        let attempts = 0;
        youtubeMetaTimerRef.current = setInterval(() => {
          attempts += 1;
          if (!youtubePlayer) return;
          const dur = youtubePlayer.getDuration?.() ?? 0;
          const ct = youtubePlayer.getCurrentTime?.() ?? 0;
          if (dur > 0) {
            setDuration(dur);
            setCurrentTime(ct);
            setProgress(dur ? (ct / dur) * 100 : 0);
            clearYouTubeMetaTimer();
            if (import.meta.env.DEV) console.debug('[YT] meta ready (state 3/5), cleared meta poller');
          } else if (attempts > 30) {
            // 9 saniye sonra bırak (30 * 300ms)
            clearYouTubeMetaTimer();
            if (import.meta.env.DEV) console.debug('[YT] meta poller gave up');
          }
        }, 300);
        if (import.meta.env.DEV) console.debug('[YT] meta poller started (state 3/5)');
      }
    }
  };

  // Olası yarış koşullarına karşı: isPlaying veya player referansı sonradan gelirse interval başlat
  useEffect(() => {
    if (playerType !== 'youtube') return;
    if (isPlaying && youtubePlayer) {
      clearYouTubeTimer();
      youtubeTimerRef.current = setInterval(() => {
        const ct = youtubePlayer.getCurrentTime?.() ?? 0;
        const dur = youtubePlayer.getDuration?.() ?? 0;
        setCurrentTime(ct);
        setDuration(dur || 0);
        setProgress(dur ? (ct / dur) * 100 : 0);
      }, 500);
      if (import.meta.env.DEV) console.debug('[YT] timer started via effect');
    } else {
      clearYouTubeTimer();
      if (import.meta.env.DEV) console.debug('[YT] timer cleared via effect');
    }
  }, [playerType, isPlaying, youtubePlayer]);

  // YouTube player hazır olduğunda ve videoId değiştiğinde videoyu yükle/oynat (hazırlık yarışı koşullarını yakalamak için)
  useEffect(() => {
    if (playerType !== 'youtube') return;
    if (!youtubePlayer || !currentVideoId) return;

    try {
      if (youtubePlayer.player && typeof youtubePlayer.player.loadVideoById === 'function') {
        youtubePlayer.player.loadVideoById(currentVideoId);
      } else if (typeof youtubePlayer.seekTo === 'function') {
        // Yedek: farklı sarma varsa setCurrentTime ile tetiklenebilir ama burada gerek yok
      }
      if (typeof youtubePlayer.play === 'function') {
        // Autoplay engellenebilir; kullanıcı etkileşimi gerekirse sessizce hata alırız
        youtubePlayer.play();
      }
      if (import.meta.env.DEV) console.debug('[YT] load/play requested for', currentVideoId);
      // Metadata polling'i tetikle
      clearYouTubeMetaTimer();
      let attempts = 0;
      youtubeMetaTimerRef.current = setInterval(() => {
        attempts += 1;
        const dur = youtubePlayer.getDuration?.() ?? 0;
        const ct = youtubePlayer.getCurrentTime?.() ?? 0;
        if (dur > 0) {
          setDuration(dur);
          setCurrentTime(ct);
          setProgress(dur ? (ct / dur) * 100 : 0);
          clearYouTubeMetaTimer();
          if (import.meta.env.DEV) console.debug('[YT] meta ready after load/play');
        } else if (attempts > 30) {
          clearYouTubeMetaTimer();
          if (import.meta.env.DEV) console.debug('[YT] meta poller gave up after load/play');
        }
      }, 300);
    } catch (e) {
      console.warn('YouTube video yüklenirken hata:', e);
    }
  }, [playerType, youtubePlayer, currentVideoId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearYouTubeTimer();
      clearYouTubeMetaTimer();
    };
  }, []);

  // Resolve Spotify link to a YouTube URL using song metadata or Spotify oEmbed
  const resolveSpotifyToYouTube = async (song) => {
    try {
      let qTitle = song.title?.trim();
      let qArtist = song.artist?.trim();

      if ((!qTitle || !qArtist) && song.url) {
        try {
          const resp = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(song.url)}`);
          if (resp.ok) {
            const meta = await resp.json();
            if (!qTitle && meta.title) qTitle = meta.title;
            if (!qArtist && meta.author_name) qArtist = meta.author_name;
          }
        } catch (e) {
          console.warn('Spotify oEmbed alınamadı:', e);
        }
      }

      const query = [qTitle, qArtist].filter(Boolean).join(' ');
      if (!query) return null;

      const results = await youtubeApi.searchMusic(query, 1);
      if (Array.isArray(results) && results.length > 0) {
        return results[0].url;
      }
    } catch (err) {
      console.error('Spotify -> YouTube dönüşüm hatası (Context):', err);
    }
    return null;
  };

  // Playback controls
  const playSong = async (index, songList = null) => {
    if (songList) {
      setSongs(songList);
    }
    
    const targetSongs = songList || songs;
    if (index < 0 || index >= targetSongs.length) return;

    let song = targetSongs[index];
    let urlType = getURLType(song.url);

    // If it's a Spotify link, try resolving to YouTube on the fly
    if (song.url && song.url.includes('spotify.com')) {
      const ytUrl = await resolveSpotifyToYouTube(song);
      if (ytUrl) {
        urlType = 'youtube';
        song = { ...song, url: ytUrl };
        // persist into local state list so subsequent plays are instant
        const updated = [...targetSongs];
        updated[index] = song;
        setSongs(updated);
      } else {
        console.warn('Spotify bağlantısı çözümlenemedi.');
      }
    }

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
      
      // Wait for controls to be ready; use underlying player if exposed
      if (youtubePlayer && videoId) {
        if (youtubePlayer.player && typeof youtubePlayer.player.loadVideoById === 'function') {
          youtubePlayer.player.loadVideoById(videoId);
        }
        if (typeof youtubePlayer.play === 'function') {
          youtubePlayer.play();
        }
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
      // UI'yı anında senkron tut
      const dur = audioRef.current.duration || 0;
      const ct = audioRef.current.currentTime || 0;
      setCurrentTime(ct);
      setDuration(dur);
      setProgress(dur ? (ct / dur) * 100 : 0);
    } else if (playerType === 'youtube' && youtubePlayer) {
      youtubePlayer.seekTo(time);
      // Anında UI senkronizasyonu (YouTube)
      try {
        const dur = youtubePlayer.getDuration?.() ?? duration;
        const ct = youtubePlayer.getCurrentTime?.() ?? time;
        setDuration(dur || 0);
        setCurrentTime(ct || 0);
        setProgress(dur ? (ct / dur) * 100 : 0);
      } catch {
        // sessizce geç
      }
      // Oynatma sürüyorsa polling'i yeniden başlat (olası clear durumlarına karşı)
      if (isPlaying) {
        clearYouTubeTimer();
        youtubeTimerRef.current = setInterval(() => {
          const ct2 = youtubePlayer.getCurrentTime?.() ?? 0;
          const dur2 = youtubePlayer.getDuration?.() ?? 0;
          setCurrentTime(ct2);
          setDuration(dur2 || 0);
          setProgress(dur2 ? (ct2 / dur2) * 100 : 0);
        }, 500);
      }
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