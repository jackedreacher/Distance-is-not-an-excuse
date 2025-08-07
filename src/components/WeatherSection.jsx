import { getWeatherIcon, getWeatherMessage, CITY1, CITY2 } from '../utils/weatherUtils'

const WeatherSection = ({ loading, weather1, weather2 }) => {
  return (
    <div className="weather-container">
     
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
  )
}

export default WeatherSection 