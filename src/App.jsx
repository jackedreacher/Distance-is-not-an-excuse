import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [daysApart, setDaysApart] = useState(0)
  const [hoursApart, setHoursApart] = useState(0)
  const [minutesApart, setMinutesApart] = useState(0)
  const [secondsApart, setSecondsApart] = useState(0)
  
  // Weather states
  const [weather1, setWeather1] = useState(null)
  const [weather2, setWeather2] = useState(null)
  const [loading, setLoading] = useState(true)

  // Set your reunion date here (YYYY, MM-1, DD)
  // Note: Month is 0-indexed, so January is 0, February is 1, etc.
  const reunionDate = new Date(2026, 6, 13) // July 13, 2026 (July is month 6)

  // Weather API configuration
  const WEATHER_API_KEY = '' // Your OpenWeatherMap API key
  const CITY1 = 'Istanbul' // Your city
  const CITY2 = 'Adana'    // Your girlfriend's city in Turkey
  
  // Weather simulation (since API key needs activation)
  const USE_WEATHER_SIMULATION = true // Set to true to use realistic weather simulation
  
  // Mobile interactive features
  const [giftBoxTaps, setGiftBoxTaps] = useState(0)
  const [giftBoxOpen, setGiftBoxOpen] = useState(false)
  const [squirrelVisible, setSquirrelVisible] = useState(false)
  const [pullToRefresh, setPullToRefresh] = useState(false)
  const [touchStartY, setTouchStartY] = useState(0)
  const [squirrelMessage, setSquirrelMessage] = useState('')

  // Pixel art weather icons
  const getWeatherIcon = (weatherCode) => {
    const icons = {
      '01d': '☀️', // clear sky day
      '01n': '🌙', // clear sky night
      '02d': '⛅', // few clouds day
      '02n': '☁️', // few clouds night
      '03d': '☁️', // scattered clouds
      '03n': '☁️',
      '04d': '☁️', // broken clouds
      '04n': '☁️',
      '09d': '🌧️', // shower rain
      '09n': '🌧️',
      '10d': '🌦️', // rain day
      '10n': '🌧️', // rain night
      '11d': '⛈️', // thunderstorm
      '11n': '⛈️',
      '13d': '❄️', // snow
      '13n': '❄️',
      '50d': '🌫️', // mist
      '50n': '🌫️'
    }
    return icons[weatherCode] || '🌤️'
  }

  // Romantic weather messages with Turkish flavor
  const getWeatherMessage = (weatherCode, city) => {
    const messages = {
      '01d': city === 'Adana' ? `Adana'da güzel güneşli gün - seni düşünüyorum ☀️` : `İstanbul'da güzel güneşli gün - seni düşünüyorum ☀️`,
      '01n': city === 'Adana' ? `Adana'nın yıldızlı gökyüzünde seni özlüyorum ⭐` : `İstanbul'un yıldızlı gökyüzünde seni özlüyorum ⭐`,
      '02d': city === 'Adana' ? `Adana'da bulutlu gökyüzü, ama senin için aşkım açık 💕` : `İstanbul'da bulutlu gökyüzü, ama senin için aşkım açık 💕`,
      '02n': city === 'Adana' ? `Adana'da ay, senin güzel gözlerini hatırlatıyor 🌙` : `İstanbul'da ay, senin güzel gözlerini hatırlatıyor 🌙`,
      '03d': city === 'Adana' ? `Adana'daki bulutlar bile senin için olan aşkımı gizleyemez ☁️` : `İstanbul'daki bulutlar bile senin için olan aşkımı gizleyemez ☁️`,
      '03n': city === 'Adana' ? `Adana'da bu gece seni hayal ediyorum 💭` : `İstanbul'da bu gece seni hayal ediyorum 💭`,
      '04d': city === 'Adana' ? `Adana'da kapalı hava, ama kalbim senin için parlak 🌤️` : `İstanbul'da kapalı hava, ama kalbim senin için parlak 🌤️`,
      '04n': city === 'Adana' ? `Adana'nın gece gökyüzü senin için düşüncelerimi tutuyor 🌌` : `İstanbul'un gece gökyüzü senin için düşüncelerimi tutuyor 🌌`,
      '09d': city === 'Adana' ? `Adana'da yağmur - her damla senin için olan aşkımı hatırlatıyor 🌧️` : `İstanbul'da yağmur - her damla senin için olan aşkımı hatırlatıyor 🌧️`,
      '09n': city === 'Adana' ? `Adana'daki yağmur senin için olan özlemimi söylüyor 💧` : `İstanbul'daki yağmur senin için olan özlemimi söylüyor 💧`,
      '10d': city === 'Adana' ? `Adana'da gökkuşağı havası - tıpkı aşkımızın renkleri gibi 🌈` : `İstanbul'da gökkuşağı havası - tıpkı aşkımızın renkleri gibi 🌈`,
      '10n': city === 'Adana' ? `Adana'daki nazik yağmur senin adını fısıldıyor 💦` : `İstanbul'daki nazik yağmur senin adını fısıldıyor 💦`,
      '11d': city === 'Adana' ? `Adana'da fırtınalı hava, ama senin için olan aşkım sakin ⛈️` : `İstanbul'da fırtınalı hava, ama senin için olan aşkım sakin ⛈️`,
      '11n': city === 'Adana' ? `Adana'daki gök gürültüsü senin için olan kalp atışımı yankılıyor ⚡` : `İstanbul'daki gök gürültüsü senin için olan kalp atışımı yankılıyor ⚡`,
      '13d': city === 'Adana' ? `Adana'da kar - aşkımız gibi saf ve güzel ❄️` : `İstanbul'da kar - aşkımız gibi saf ve güzel ❄️`,
      '13n': city === 'Adana' ? `Adana'daki kar senin için olan aşkım gibi parıldıyor ✨` : `İstanbul'daki kar senin için olan aşkım gibi parıldıyor ✨`,
      '50d': city === 'Adana' ? `Adana'da sisli hava - aşk hikayemiz gibi gizemli 🌫️` : `İstanbul'da sisli hava - aşk hikayemiz gibi gizemli 🌫️`,
      '50n': city === 'Adana' ? `Adana'daki sis senin için olan duygularımı gizleyemez 💭` : `İstanbul'daki sis senin için olan duygularımı gizleyemez 💭`
    }
    return messages[weatherCode] || (city === 'Adana' ? `Adana'da seni düşünüyorum 💕` : `İstanbul'da seni düşünüyorum 💕`)
  }

  // Get realistic weather simulation
  const getSimulatedWeather = (city) => {
    const now = new Date()
    const hour = now.getHours()
    const month = now.getMonth() // 0-11
    
    // Base temperatures for each city
    const baseTemps = {
      'Istanbul': { winter: 8, spring: 15, summer: 25, autumn: 18 },
      'Adana': { winter: 12, spring: 20, summer: 30, autumn: 22 }
    }
    
    // Determine season
    let season
    if (month >= 2 && month <= 4) season = 'spring'
    else if (month >= 5 && month <= 7) season = 'summer'
    else if (month >= 8 && month <= 10) season = 'autumn'
    else season = 'winter'
    
    // Get base temperature for city and season
    const baseTemp = baseTemps[city][season]
    
    // Add some realistic variation (-3 to +3 degrees)
    const variation = (Math.sin(now.getTime() / 86400000) * 3) // Daily variation
    const temp = Math.round(baseTemp + variation)
    
    // Determine weather condition based on season and time
    let weatherIcon, weatherId
    if (season === 'summer' && hour >= 6 && hour <= 18) {
      weatherIcon = '01d' // Clear sky day
      weatherId = 800
    } else if (season === 'winter' && Math.random() > 0.7) {
      weatherIcon = '13d' // Snow
      weatherId = 600
    } else if (Math.random() > 0.6) {
      weatherIcon = '02d' // Few clouds
      weatherId = 801
    } else {
      weatherIcon = '01d' // Clear sky
      weatherId = 800
    }
    
    return {
      main: { temp },
      weather: [{ id: weatherId, icon: weatherIcon }],
      name: city
    }
  }

  // Random squirrel messages
  const squirrelMessages = [
    "Sürpriz! Seni seviyorum! 💕",
    "Seni çok özledim! 🥺",
    "Sen benim her şeyimsin! ✨",
    "Seni görmek için sabırsızlanıyorum! 🥰",
    "Kalbimi gülümsetiyorsun! 💖",
    "Hep seni düşünüyorum! 💭",
    "Sen benim favori kişimsin! 🌟",
    "Her gün seni daha çok seviyorum! 💝",
    "Sen benim güneşimsin! ☀️",
    "Gülümsemeni özledim! 😊",
    "Sen benim hayalimsin! 💫",
    "Sonsuza dek senin! 💕",
    "Sen benim mutluluğumsun! 🎉",
    "Seni aya kadar seviyorum! 🌙",
    "Sen benim mükemmel eşimsin! 💞"
  ]

  // Gift box interaction
  const handleGiftBoxTap = () => {
    const newTaps = giftBoxTaps + 1
    setGiftBoxTaps(newTaps)
    
    if (newTaps >= 6) {
      // Get random message
      const randomMessage = squirrelMessages[Math.floor(Math.random() * squirrelMessages.length)]
      setSquirrelMessage(randomMessage)
      
      setGiftBoxOpen(true)
      setSquirrelVisible(true)
      setGiftBoxTaps(0)
      
      // Hide squirrel after 5 seconds
      setTimeout(() => {
        setSquirrelVisible(false)
        setGiftBoxOpen(false)
        setSquirrelMessage('')
      }, 5000)
    }
  }

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

  // Fetch weather data
  const fetchWeather = async (city, setWeather) => {
    try {
      console.log(`Fetching weather for ${city}...`)
      
      if (USE_WEATHER_SIMULATION) {
        // Use realistic weather simulation
        const simulatedWeather = getSimulatedWeather(city)
        console.log(`Simulated weather for ${city}:`, simulatedWeather)
        setWeather(simulatedWeather)
      } else {
        // Original OpenWeatherMap API
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${city},TR&appid=${WEATHER_API_KEY}&units=metric&lang=tr`
        )
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error(`API Error for ${city}:`, errorData)
          throw new Error(`Weather API error: ${response.status} - ${errorData.message || response.statusText}`)
        }
        
        const weatherData = await response.json()
        console.log(`Weather data for ${city}:`, weatherData)
        
        // Validate the weather data
        if (!weatherData.main || !weatherData.weather || !weatherData.weather[0]) {
          throw new Error('Invalid weather data structure')
        }
        
        setWeather(weatherData)
      }
    } catch (error) {
      console.error(`Error fetching weather for ${city}:`, error)
      
      // Fallback to simulation
      const simulatedWeather = getSimulatedWeather(city)
      setWeather(simulatedWeather)
    }
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeDiff = reunionDate - now
      
      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
        
        setDaysApart(days)
        setHoursApart(hours)
        setMinutesApart(minutes)
        setSecondsApart(seconds)
      } else {
        setDaysApart(0)
        setHoursApart(0)
        setMinutesApart(0)
        setSecondsApart(0)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Fetch weather on component mount
  useEffect(() => {
    const loadWeather = async () => {
      setLoading(true)
      await Promise.all([
        fetchWeather(CITY1, setWeather1),
        fetchWeather(CITY2, setWeather2)
      ])
      setLoading(false)
    }
    
    loadWeather()
    
    // Refresh weather every 30 minutes
    const weatherInterval = setInterval(loadWeather, 30 * 60 * 1000)
    
    return () => clearInterval(weatherInterval)
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
      
      {/* Gift Box */}
      <div className="gift-box-container">
        <div 
          className={`gift-box ${giftBoxOpen ? 'open' : ''}`}
          onClick={handleGiftBoxTap}
        >
          <div className="gift-box-lid">
            {giftBoxOpen ? '🎁' : '🎁'}
          </div>
          <div className="gift-box-body">
            {giftBoxOpen ? '' : '🎁'}
          </div>
        </div>
      </div>
      
      {/* Squirrel Animation */}
      {squirrelVisible && (
        <div className="squirrel-container">
          <div className="squirrel-emerging">🐿️</div>
          <div className="squirrel-message">{squirrelMessage}</div>
        </div>
      )}
      
      <div className="container">
        <header className="header">
          <h1 className="title">💕 Birbirimize Geri Sayım 💕</h1>
          <p className="subtitle">Her an bizi birbirimize daha da yaklaştırıyor...</p>
        </header>

        {/* Weather Section */}
        <div className="weather-container">
          <h2 className="weather-title">🌍 Şehirlerimizdeki Hava Durumu</h2>
          <p className="weather-note"></p>
          <div className="weather-cards">
            {loading ? (
              <div className="weather-loading">Hava durumu verileri yükleniyor...</div>
            ) : (
              <>
                <div className="weather-card">
                  <h3 className="city-name">🏠 {CITY1}</h3>
                  {weather1 ? (
                    <>
                      <div className="weather-icon">
                        {getWeatherIcon(weather1.weather[0].icon)}
                      </div>
                      <div className="weather-temp">
                        {Math.round(weather1.main.temp)}°C
                      </div>
                      <p className="weather-message">
                        {getWeatherMessage(weather1.weather[0].icon, CITY1)}
                      </p>
                    </>
                  ) : (
                    <div className="weather-error">
                      <div className="weather-icon">🌤️</div>
                      <div className="weather-temp">--°C</div>
                      <p className="weather-message">Weather data unavailable</p>
                    </div>
                  )}
                </div>
                
                <div className="weather-card">
                  <h3 className="city-name">💕 {CITY2}</h3>
                  {weather2 ? (
                    <>
                      <div className="weather-icon">
                        {getWeatherIcon(weather2.weather[0].icon)}
                      </div>
                      <div className="weather-temp">
                        {Math.round(weather2.main.temp)}°C
      </div>
                      <p className="weather-message">
                        {getWeatherMessage(weather2.weather[0].icon, CITY2)}
      </p>
    </>
                  ) : (
                    <div className="weather-error">
                      <div className="weather-icon">🌤️</div>
                      <div className="weather-temp">--°C</div>
                      <p className="weather-message">Weather data unavailable</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="timer-container">
          <div className="timer-card">
            <div className="time-display">
              <div className="time-unit">
                <span className="number">{daysApart}</span>
                <span className="label">Gün</span>
              </div>
              <div className="time-unit">
                <span className="number">{hoursApart.toString().padStart(2, '0')}</span>
                <span className="label">Saat</span>
              </div>
              <div className="time-unit">
                <span className="number">{minutesApart.toString().padStart(2, '0')}</span>
                <span className="label">Dakika</span>
              </div>
              <div className="time-unit">
                <span className="number">{secondsApart.toString().padStart(2, '0')}</span>
                <span className="label">Saniye</span>
              </div>
            </div>
            <p className="message">Tekrar bir araya gelene kadar...</p>
          </div>
        </div>

        <div className="love-messages">
          <div className="message-card">
            <h3>💝 Kalbim</h3>
            <p>Geçen her gün bizi buluşmamıza bir adım daha yaklaştırıyor. Seni tekrar kucaklamak için sabırsızlanıyorum.</p>
          </div>
          
          <div className="message-card">
            <h3>🌟 Aşkım</h3>
            <p>Güzel gülümsemeni görebilmek ve sıcak kucaklaşmanı hissedebilmek için her saniyeyi sayıyorum.</p>
          </div>
          
          <div className="message-card">
            <h3>💫 Her Şeyim</h3>
            <p>13 Temmuz 2026 - kalplerimizin tekrar birlikte atacağı gün. Her geçen anla seni daha çok seviyorum.</p>
          </div>
        </div>

        <footer className="footer">
          <p>Hayatımın aşkı için 💖 ile yapıldı</p>
          <p>13 Temmuz 2026'ya geri sayım - mükemmel buluşmamız</p>
        </footer>
      </div>
    </div>
  )
}

export default App
