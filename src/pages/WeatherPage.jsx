import { useState, useEffect } from 'react'
import WeatherSection from '../components/WeatherSection'
import { fetchWeather, CITY1, CITY2 } from '../utils/weatherUtils'

const WeatherPage = () => {
  const [weather1, setWeather1] = useState(null)
  const [weather2, setWeather2] = useState(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">🌍 Şehirlerimizdeki Hava Durumu</h1>
        <p className="page-subtitle">İstanbul ve Osmaniye'deki güncel hava durumu bilgileri</p>
      </header>
      <div style={{ height: '100px' }}></div>
      <WeatherSection loading={loading} weather1={weather1} weather2={weather2} />
    </div>
  )
}

export default WeatherPage