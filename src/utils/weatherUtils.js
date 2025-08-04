// Weather API configuration
export const WEATHER_API_KEY = '' // Your OpenWeatherMap API key
export const CITY1 = 'Istanbul' // Your city
export const CITY2 = 'Adana'    // Your girlfriend's city in Turkey

// Weather simulation (since API key needs activation)
export const USE_WEATHER_SIMULATION = true // Set to true to use realistic weather simulation

// Pixel art weather icons
export const getWeatherIcon = (weatherCode) => {
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
export const getWeatherMessage = (weatherCode, city) => {
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
export const getSimulatedWeather = (city) => {
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

// Fetch weather data
export const fetchWeather = async (city, setWeather) => {
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