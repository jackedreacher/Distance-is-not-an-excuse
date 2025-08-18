import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'

// Import utility functions
import { calculateTimeDifference } from './utils/timeUtils'

// Import components
import CountdownTimer from './components/CountdownTimer'
import GiftBox from './components/GiftBox'
import Navigation from './components/Navigation'

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

// Import Contexts
import { AuthProvider } from './contexts/AuthContextProvider.jsx'
import { SocketProvider } from './contexts/SocketContext.jsx'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  const [daysApart, setDaysApart] = useState(0)
  const [hoursApart, setHoursApart] = useState(0)
  const [minutesApart, setMinutesApart] = useState(0)
  const [secondsApart, setSecondsApart] = useState(0)
  
  // Mobile interactive features
  const [giftBoxTaps, setGiftBoxTaps] = useState(0)
  const [giftBoxOpen, setGiftBoxOpen] = useState(false)
  const [squirrelVisible, setSquirrelVisible] = useState(false)
  const [pullToRefresh, setPullToRefresh] = useState(false)
  const [touchStartY, setTouchStartY] = useState(0)
  const [squirrelMessage, setSquirrelMessage] = useState('')

  // Pull to refresh functionality
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e) => {
    const touchY = e.touches[0].clientY
    const diff = touchStartY - touchY
    
    if (diff > 100 && window.scrollY === 0) {
      setPullToRefresh(true)
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

  return (
    <AuthProvider>
      <SocketProvider>
          <div
            className="app-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Navigation */}
            <Navigation />
            
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
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Routes>
            </div>
          </div>
      </SocketProvider>
    </AuthProvider>
  )
}

export default App
