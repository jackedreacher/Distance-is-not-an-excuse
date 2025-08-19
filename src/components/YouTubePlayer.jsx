import { useEffect, useRef, useState } from 'react';

const YouTubePlayer = ({ videoId, onReady, onStateChange, autoplay = false, controls = true, privacyEnhanced = true }) => {
  const playerRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [isAPIReady, setIsAPIReady] = useState(false);

  // YouTube API'sini yükle
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsAPIReady(true);
      };
    } else {
      setIsAPIReady(true);
    }
  }, []);

  // Player'ı başlat
  useEffect(() => {
    if (isAPIReady && videoId && !player && playerRef.current) {
      new window.YT.Player(playerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        host: privacyEnhanced ? 'https://www.youtube-nocookie.com' : 'https://www.youtube.com',
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: controls ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          cc_load_policy: 0,
          iv_load_policy: 3,
          autohide: 0,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            setPlayer(event.target);
            console.log('YouTube Player ready');
          },
          onStateChange: (event) => {
            if (onStateChange) onStateChange(event);
          }
        }
      });
    }
  }, [isAPIReady, videoId, player, autoplay, controls, onStateChange, privacyEnhanced]);

  // Video değiştiğinde player'ı güncelle
  useEffect(() => {
    if (player && videoId) {
      player.loadVideoById(videoId);
    }
  }, [player, videoId]);

  const isAttached = () => {
    try {
      const iframe = player?.getIframe?.();
      return !!(iframe && document.body.contains(iframe));
    } catch {
      return false;
    }
  };

  // Player kontrolları
  const play = () => {
    if (player && isAttached()) player.playVideo();
  };

  const pause = () => {
    if (player && isAttached()) player.pauseVideo();
  };

  const stop = () => {
    if (player && isAttached()) player.stopVideo();
  };

  const setVolume = (volume) => {
    if (player && isAttached()) player.setVolume(volume);
  };

  const getCurrentTime = () => {
    return player && isAttached() ? player.getCurrentTime() : 0;
  };

  const getDuration = () => {
    return player && isAttached() ? player.getDuration() : 0;
  };

  const seekTo = (seconds) => {
    if (player && isAttached()) player.seekTo(seconds, true);
  };

  // Player kontrollarını parent component'e gönder
  useEffect(() => {
    if (player && onReady) {
      onReady({
        play,
        pause,
        stop,
        setVolume,
        getCurrentTime,
        getDuration,
        seekTo,
        player
      });
    }
  }, [player]);

  return (
    <div className="youtube-player-container" style={{ position: 'fixed', bottom: 0, left: 0, width: '320px', height: '200px', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
      <div ref={playerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default YouTubePlayer;