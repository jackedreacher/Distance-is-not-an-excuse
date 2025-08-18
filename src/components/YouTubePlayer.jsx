import { useEffect, useRef, useState } from 'react';

const YouTubePlayer = ({ videoId, onReady, onStateChange, autoplay = false, controls = true }) => {
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
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: controls ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          cc_load_policy: 0,
          iv_load_policy: 3,
          autohide: 0
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
  }, [isAPIReady, videoId, player, autoplay, controls, onStateChange]);

  // Video değiştiğinde player'ı güncelle
  useEffect(() => {
    if (player && videoId) {
      player.loadVideoById(videoId);
    }
  }, [player, videoId]);

  // Player kontrolları
  const play = () => {
    if (player) player.playVideo();
  };

  const pause = () => {
    if (player) player.pauseVideo();
  };

  const stop = () => {
    if (player) player.stopVideo();
  };

  const setVolume = (volume) => {
    if (player) player.setVolume(volume);
  };

  const getCurrentTime = () => {
    return player ? player.getCurrentTime() : 0;
  };

  const getDuration = () => {
    return player ? player.getDuration() : 0;
  };

  const seekTo = (seconds) => {
    if (player) player.seekTo(seconds);
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
    <div className="youtube-player-container" style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}>
      <div ref={playerRef} style={{ width: '1px', height: '1px' }} />
    </div>
  );
};

export default YouTubePlayer;