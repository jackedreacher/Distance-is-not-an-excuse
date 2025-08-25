import { useState, useEffect } from 'react'
import { getMotivationForDay, getMotivationForDayAsync } from '../utils/motivationUtils'
import '../styles/motivation.css' // Import the new CSS file

const DailyMotivation = () => {
  const [motivation, setMotivation] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Get current day of year for consistent daily motivation
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now - start
    const oneDay = 1000 * 60 * 60 * 24
    const dayOfYear = Math.floor(diff / oneDay)

    ;(async () => {
      try {
        const dailyMotivation = await getMotivationForDayAsync(dayOfYear)
        setMotivation(dailyMotivation)
      } catch (err) {
        console.warn('Günün motivasyonu: çevrimiçi kaynaktan çekilemedi, statik yedeğe geçiliyor.', err)
        const fallback = getMotivationForDay(dayOfYear)
        setMotivation(fallback)
      }
      // Animate in after a short delay
      setTimeout(() => setIsVisible(true), 500)
    })()
  }, [])

  if (!motivation) return null

  return (
    <div className={`motivation-container ${isVisible ? 'visible' : ''}`}>
      <div className="motivation-card">
        <div className="motivation-header">
          <h2 className="motivation-title">🌟 Günün Motivasyonu 🌟</h2>
          <p className="motivation-subtitle">Senin için özel seçilmiş bir mesaj</p>
        </div>
        
        <div className="quote-section">
          <div className="quote-icon">💭</div>
          <blockquote className="quote-text">
            "{motivation.quote}"
          </blockquote>
          <cite className="quote-author">— {motivation.author}</cite>
        </div>
        
        <div className="motivation-section">
          <div className="motivation-icon">💝</div>
          <p className="motivation-message">
            {motivation.motivation}
          </p>
        </div>
        
        <div className="motivation-footer">
          <div className="sparkle">✨</div>
          <p className="footer-text">Sen her gün daha da güçlü oluyorsun!</p>
          <div className="sparkle">✨</div>
        </div>
      </div>
    </div>
  )
}

export default DailyMotivation