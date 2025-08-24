import { formatTimeUnit } from '../utils/timeUtils'
import Icon1 from '../assets/Untitled design (1).svg'
import Icon2 from '../assets/Untitled design (2).svg'

const CountdownTimer = ({ daysApart, hoursApart, minutesApart, secondsApart }) => {
  return (
    <div className="timer-container">
      <div className="timer-card">
        <div className="time-and-icons">
          {/* countdown-icons removed intentionally */}
          <div className="time-display">
            <div className="time-unit">
              <span className="number">{daysApart}</span>
              <span className="label">Gün</span>
            </div>
            <div className="time-unit">
              <span className="number">{formatTimeUnit(hoursApart)}</span>
              <span className="label">Saat</span>
            </div>
            <div className="time-unit">
              <span className="number">{formatTimeUnit(minutesApart)}</span>
              <span className="label">Dakika</span>
            </div>
            <div className="time-unit">
              <span className="number">{formatTimeUnit(secondsApart)}</span>
              <span className="label">Saniye</span>
            </div>
          </div>
        </div>
        <p className="message">Tekrar bir araya gelene kadar...</p>
      </div>
    </div>
  )
}

export default CountdownTimer