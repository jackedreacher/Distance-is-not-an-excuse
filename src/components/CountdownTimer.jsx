import { formatTimeUnit } from '../utils/timeUtils'

const CountdownTimer = ({ daysApart, hoursApart, minutesApart, secondsApart }) => {
  return (
    <div className="timer-container">
      <div className="timer-card">
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
        <p className="message">Tekrar bir araya gelene kadar...</p>
      </div>
    </div>
  )
}

export default CountdownTimer 