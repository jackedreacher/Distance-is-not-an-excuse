import { useState, useEffect } from 'react'
import './App.css'

// Import utility functions
import { calculateTimeDifference } from './utils/timeUtils'
import { fetchWeather, CITY1, CITY2 } from './utils/weatherUtils'

// Import components
import WeatherSection from './components/WeatherSection'
import CountdownTimer from './components/CountdownTimer'
import GiftBox from './components/GiftBox'
import LoveMessages from './components/LoveMessages'
import DailyMotivation from './components/DailyMotivation'
import MovieRecommendations from './components/MovieRecommendations'
import MesafeOyunu from './components/MesafeOyunu'

function App() {
  const [daysApart, setDaysApart] = useState(0)
  const [hoursApart, setHoursApart] = useState(0)
  const [minutesApart, setMinutesApart] = useState(0)
  const [secondsApart, setSecondsApart] = useState(0)
  
  // Weather states
  const [weather1, setWeather1] = useState(null)
  const [weather2, setWeather2] = useState(null)
  const [loading, setLoading] = useState(true)
  
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
        // Refresh weather data
        loadWeather()
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

  // Load weather function for refresh
  const loadWeather = async () => {
    setLoading(true)
    await Promise.all([
      fetchWeather(CITY1, setWeather1),
      fetchWeather(CITY2, setWeather2)
    ])
    setLoading(false)
  }

  // Fetch weather on component mount
  useEffect(() => {
    loadWeather()
    
    // Refresh weather every 30 minutes
    const weatherInterval = setInterval(loadWeather, 30 * 60 * 1000)
    
    return () => clearInterval(weatherInterval)
  }, [])

  return (
    <div 
      className="app"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
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
      
      <div className="container">
        <header className="header">
          <h1 className="title">💕 Birbirimize Geri Sayım 💕</h1>
          <p className="subtitle">Her an bizi birbirimize daha da yaklaştırıyor...</p>
        </header>

              {/* Weather Section */}
      <WeatherSection loading={loading} weather1={weather1} weather2={weather2} />

      {/* Countdown Timer */}
      <CountdownTimer 
        daysApart={daysApart} 
        hoursApart={hoursApart} 
        minutesApart={minutesApart} 
        secondsApart={secondsApart} 
      />

      {/* Daily Motivation */}
      <DailyMotivation />

      {/* Love Messages */}
      <LoveMessages />

      {/* Movie Recommendations */}
      <MovieRecommendations />

      <MesafeOyunu />

        <footer className="footer">
          <p>Hayatımın aşkı için 💖 ile yapıldı</p>
          <p>13 Temmuz 2026'ya geri sayım - mükemmel buluşmamız</p>
        </footer>
      </div>
    </div>
  )
}

export default App
