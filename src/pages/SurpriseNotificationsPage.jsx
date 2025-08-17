import SurpriseNotifications from '../components/SurpriseNotifications'

const SurpriseNotificationsPage = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">💕 Sürprizlerimiz 💕</h1>
        <p className="page-subtitle">Birbirimize özel sürpriz mesajlar hazırlayalım</p>
      </header>
      <SurpriseNotifications />
    </div>
  )
}

export default SurpriseNotificationsPage