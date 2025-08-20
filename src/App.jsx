import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
// import './App.css'
import './styles/variables.css'
import './styles/base.css'
import './styles/navigation.css'
import './styles/movies.css'
import './styles/wishlist.css'
import './styles/music.css'
import './styles/games.css'
import './styles/player.css'
import './styles/romantic.css'
import './styles/responsive.css'

// Import utility functions
import { calculateTimeDifference } from './utils/timeUtils'

// Import components
import CountdownTimer from './components/CountdownTimer'
import GiftBox from './components/GiftBox'
 import Navigation from './components/Navigation'
import MiniPlayer from './components/MiniPlayer'

// Import pages
import WeatherPage from './pages/WeatherPage'
import LoveMessagesPage from './pages/LoveMessagesPage'
import DailyMotivationPage from './pages/DailyMotivationPage'
import MovieRecommendationsPage from './pages/MovieRecommendationsPage'
import MesafeOyunuPage from './pages/MesafeOyunuPage'
import MoodTrackerPage from './pages/MoodTrackerPage'
import WishlistPage from './pages/WishlistPage'
import MusicPlaylistPage from './pages/MusicPlaylistPage'
import SurpriseNotificationsPage from './pages/SurpriseNotificationsPage'
import BotsPage from './pages/BotsPage'

// Import Contexts
import { SocketProvider } from './contexts/SocketContext.jsx'
import GlobalHeroPlayer from './components/GlobalHeroPlayer'
import { usePlayer } from './contexts/PlayerContext.jsx'

function App() {
  const [daysApart, setDaysApart] = useState(0)
  const [hoursApart, setHoursApart] = useState(0)
  const [minutesApart, setMinutesApart] = useState(0)
  const [secondsApart, setSecondsApart] = useState(0)
  // Hero Player Visibility State
  const [showHeroPlayer, setShowHeroPlayer] = useState(false)
  // Toggle button visibility state
  const [isToggleVisible, setIsToggleVisible] = useState(true)
  // Swipe state for hero drawer
  const [heroTouchStartX, setHeroTouchStartX] = useState(null)
  const [heroSwipeHandled, setHeroSwipeHandled] = useState(false)
  // Mobile interactive features
  const [giftBoxTaps, setGiftBoxTaps] = useState(0)
  const [giftBoxOpen, setGiftBoxOpen] = useState(false)
  const [squirrelVisible, setSquirrelVisible] = useState(false)
  const [pullToRefresh, setPullToRefresh] = useState(false)
  const [touchStartY, setTouchStartY] = useState(0)
  const [squirrelMessage, setSquirrelMessage] = useState('')

  const { currentSong, currentVideoId } = usePlayer()
  const navigate = useNavigate()
  const location = useLocation()

  // Pull to refresh functionality
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY)
    setHeroTouchStartX(e.touches[0].clientX)
    setHeroSwipeHandled(false)
  }

  const handleTouchMove = (e) => {
    const touchY = e.touches[0].clientY
    const diff = touchStartY - touchY
    
    if (diff > 100 && window.scrollY === 0) {
      setPullToRefresh(true)
    }

    // Horizontal swipe for right-side drawer
    const touchX = e.touches[0].clientX
    const startX = heroTouchStartX ?? touchX
    const deltaX = touchX - startX
    if (!heroSwipeHandled) {
      // Close when swiping to the right while drawer is open
      if (showHeroPlayer && deltaX > 60) {
        setShowHeroPlayer(false)
        setHeroSwipeHandled(true)
      }
      // Open when swiping from the right edge to the left while drawer is closed
      else if (!showHeroPlayer && startX > window.innerWidth - 24 && deltaX < -60) {
        setShowHeroPlayer(true)
        setHeroSwipeHandled(true)
      }
    }
  }

  const handleTouchEnd = () => {
    if (pullToRefresh) {
      // Simulate refresh
      setTimeout(() => {
        setPullToRefresh(false)
        window.location.reload()
      }, 1000)
    }
    setHeroTouchStartX(null)
    setHeroSwipeHandled(false)
  }



  // When clicking the hero player toggle, if there is no current song/video yet, go to playlist
  const handleHeroToggleClick = () => {
    if (!showHeroPlayer && !currentSong && !currentVideoId) {
      navigate('/music-playlist')
      return
    }
    setShowHeroPlayer((v) => !v)
  }

  useEffect(() => {
    const updateTime = () => {
      const { days, hours, minutes, seconds } = calculateTimeDifference()
      setDaysApart(days)
      setHoursApart(hours)
      setMinutesApart(minutes)
      setSecondsApart(seconds)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])



  // Close drawer on ESC key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && showHeroPlayer) {
        setShowHeroPlayer(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showHeroPlayer])

  // Close hero drawer on route change to avoid backdrop blocking clicks
  useEffect(() => {
    if (showHeroPlayer) {
      setShowHeroPlayer(false)
    }
  }, [location.pathname])

  return (
      <SocketProvider>
          <div
            className="app-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Navigation - geçici olarak devre dışı */}
            <Navigation /> 
            {/* Hero Player Toggle Button */}
            {!showHeroPlayer && (
              <div 
                className="hero-toggle-area"
                onMouseEnter={() => setIsToggleVisible(true)}
                onTouchStart={() => setIsToggleVisible(true)}
              >
                {isToggleVisible ? (
                  <button 
                    type="button"
                    className="hero-toggle-btn visible"
                    aria-label="Müzik çalarını aç"
                    onClick={handleHeroToggleClick}
                    onMouseLeave={() => setIsToggleVisible(false)}
                  >
                    🎵 Çaları Aç
                  </button>
                ) : (
                   <div 
                     className="hero-toggle-btn hidden-arrow"
                     aria-label="Müzik çalarını göster"
                     onClick={() => setIsToggleVisible(true)}
                   >
                     ◀
                   </div>
                 )}
              </div>
            )}

            {/* Backdrop for Right-side Drawer */}
            {showHeroPlayer && (
              <div
                className={`hero-backdrop ${showHeroPlayer ? 'open' : ''}`}
                onClick={() => setShowHeroPlayer(false)}
              />
            )}

            {/* Right-side Drawer for GlobalHeroPlayer */}
            <div className={`hero-drawer ${showHeroPlayer ? 'open' : ''}`}>
              <GlobalHeroPlayer onClose={() => setShowHeroPlayer(false)} />
            </div>
            
            {/* Pull to refresh indicator */}
            {pullToRefresh && (
              <div className="pull-to-refresh">
                <div className="refresh-spinner">🔄</div>
                <p>Yenileniyor...</p>
              </div>
            )}
            
            <div className="hearts-bg">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="floating-heart" style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}>
                  ❤️
                </div>
              ))}
            </div>
            
            {/* Gift Box and Squirrel */}
            <GiftBox 
              giftBoxTaps={giftBoxTaps}
              setGiftBoxTaps={setGiftBoxTaps}
              giftBoxOpen={giftBoxOpen}
              setGiftBoxOpen={setGiftBoxOpen}
              squirrelVisible={squirrelVisible}
              setSquirrelVisible={setSquirrelVisible}
              squirrelMessage={squirrelMessage}
              setSquirrelMessage={setSquirrelMessage}
            />
            
            <div className="main-content">
              {/* Removed inline GlobalHeroPlayer rendering to avoid nesting inside content */}
              <Routes>
                {/* Main page with interactive components */}
                <Route path="/" element={
                  <div className="container">
                    <header className="header">
                      <h1 className="title">💕 Birbirimize Geri Sayım 💕</h1>
                      <p className="subtitle">Her an bizi birbirimize daha da yaklaştırıyor...</p>
                    </header>
                    
                    {/* Countdown Timer */}
                    <CountdownTimer
                      daysApart={daysApart}
                      hoursApart={hoursApart}
                      minutesApart={minutesApart}
                      secondsApart={secondsApart}
                    />
                    
                    <footer className="footer">
                      <p>Hayatımın aşkı için 💖 ile yapıldı</p>
                      <p>13 Temmuz 2026'ya geri sayım - mükemmel buluşmamız</p>
                    </footer>
                  </div>
                } />
                
                {/* Informational pages */}
                <Route path="/weather" element={<WeatherPage />} />
                <Route path="/love-messages" element={<LoveMessagesPage />} />
                <Route path="/motivation" element={<DailyMotivationPage />} />
                <Route path="/movies" element={<MovieRecommendationsPage />} />
                <Route path="/mesafe-oyunu" element={<MesafeOyunuPage />} />
                <Route path="/mood-tracker" element={<MoodTrackerPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/music-playlist" element={<MusicPlaylistPage />} />
                <Route path="/surprise-notifications" element={<SurpriseNotificationsPage />} />
                <Route path="/bots" element={<BotsPage />} />

              </Routes>
            </div>


          </div>
      </SocketProvider>
  )
}

export default App
