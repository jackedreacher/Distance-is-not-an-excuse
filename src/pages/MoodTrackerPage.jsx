import MoodTracker from '../components/MoodTracker'

const MoodTrackerPage = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">😊 Ortak Ruh Halimiz</h1>
        <p className="page-subtitle">Birbirimize olan duygularımızı paylaşalım</p>
      </header>
      <div style={{ height: '100px' }}></div>
      <MoodTracker />
    </div>
  )
}

export default MoodTrackerPage