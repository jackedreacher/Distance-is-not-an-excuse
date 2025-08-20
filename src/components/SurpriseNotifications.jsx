import { useState, useEffect } from 'react'
import { surpriseService } from '../services/api'
import CloseButton from './shared/CloseButton'

const SurpriseNotifications = ({ onNotificationShow, onNotificationHide }) => {
  const [surprises, setSurprises] = useState([])
  const [newSurprise, setNewSurprise] = useState({
    message: '',
    type: 'message',
    scheduleType: 'immediate'
  })
  const [showNotification, setShowNotification] = useState(null)
  const [view, setView] = useState('create') // 'create' or 'history'

  // Surprise types
  const surpriseTypes = [
    { id: 'message', name: 'Mesaj', icon: '💌' },
    { id: 'compliment', name: 'Övgü', icon: '😊' },
    { id: 'memory', name: 'Anı', icon: '💭' },
    { id: 'activity', name: 'Aktivite', icon: '🎪' }
  ]

  // Load surprises from API on component mount
  useEffect(() => {
    const loadSurprises = async () => {
      try {
        const data = await surpriseService.getAll();
        if (Array.isArray(data)) {
          setSurprises(data);
        }
      } catch (error) {
        console.error('Error loading surprises:', error);
      }
    };
    
    loadSurprises();
  }, [])

  // Check for scheduled surprises
  useEffect(() => {
    const checkScheduledSurprises = () => {
      const now = new Date().getTime()
      const dueSurprises = surprises.filter(surprise => {
        if (surprise.scheduleType === 'scheduled' && !surprise.delivered) {
          return new Date(surprise.scheduleTime).getTime() <= now
        }
        return false
      })

      if (dueSurprises.length > 0) {
        // Show the first due surprise
        const surpriseToShow = dueSurprises[0]
        showSurpriseNotification(surpriseToShow)
        
        // Mark as delivered
        setSurprises(prev => prev.map(s => 
          s.id === surpriseToShow.id ? { ...s, delivered: true } : s
        ))
      }
    }

    // Check every minute
    const interval = setInterval(checkScheduledSurprises, 60000)
    
    // Check immediately on load
    checkScheduledSurprises()
    
    return () => clearInterval(interval)
  }, [surprises])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewSurprise(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddSurprise = async () => {
    if (!newSurprise.message.trim()) return

    try {
      const surpriseData = {
        message: newSurprise.message,
        type: newSurprise.type,
        scheduleType: newSurprise.scheduleType,
        scheduleTime: newSurprise.scheduleTime,
        delivered: newSurprise.scheduleType === 'immediate'
      }

      const data = await surpriseService.create(surpriseData)
      if (data && data._id) {
        setSurprises(prev => [data, ...prev])

        // If immediate, show right away
        if (newSurprise.scheduleType === 'immediate') {
          showSurpriseNotification(data.surprise)
        }

        setNewSurprise({
          message: '',
          type: 'message',
          scheduleType: 'immediate'
        })
      }
    } catch (error) {
      console.error('Error saving surprise:', error)
    }
  }

  const showSurpriseNotification = async (surprise) => {
    // Update delivered status in backend
    try {
      const updatedData = { ...surprise, delivered: true }
      await surpriseService.update(surprise._id, updatedData)
      
      // Update local state
      setSurprises(prev => prev.map(s =>
        s._id === surprise._id ? { ...s, delivered: true } : s
      ))
    } catch (error) {
      console.error('Error updating surprise delivery status:', error)
    }
    
    setShowNotification(surprise)
    if (onNotificationShow) onNotificationShow()
    
    // Hide after 10 seconds
    setTimeout(() => {
      setShowNotification(null)
      if (onNotificationHide) onNotificationHide()
    }, 10000)
  }

  const getSurpriseTypeInfo = (typeId) => {
    return surpriseTypes.find(type => type.id === typeId) || surpriseTypes[0]
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatScheduleType = (scheduleType) => {
    return scheduleType === 'immediate' ? 'Hemen' : 'Zamanlanmış'
  }

  return (
    <>
      <div className="surprise-notifications-container">
        <div className="surprise-notifications-header">
          <h2 className="surprise-notifications-title">💕 Sürpriz Mesajlar 💕</h2>
          <p className="surprise-notifications-subtitle">Sevgilin için özel sürprizler hazırlayabilirsin</p>
        </div>

        <div className="surprise-notifications-tabs">
          <button 
            className={`surprise-tab ${view === 'create' ? 'active' : ''}`}
            onClick={() => setView('create')}
          >
            Sürpriz Oluştur
          </button>
          <button 
            className={`surprise-tab ${view === 'history' ? 'active' : ''}`}
            onClick={() => setView('history')}
          >
            Sürpriz Geçmişi
          </button>
        </div>

        {view === 'create' && (
          <div className="create-surprise-section">
            <h3>Yeni Sürpriz Oluştur</h3>
            <div className="create-surprise-form">
              <select
                name="type"
                value={newSurprise.type}
                onChange={handleInputChange}
                className="surprise-select"
              >
                {surpriseTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
              
              <textarea
                name="message"
                placeholder="Sürpriz mesajını yaz..."
                value={newSurprise.message}
                onChange={handleInputChange}
                className="surprise-textarea"
                rows="4"
              />
              
              <div className="schedule-options">
                <label className="schedule-option">
                  <input
                    type="radio"
                    name="scheduleType"
                    value="immediate"
                    checked={newSurprise.scheduleType === 'immediate'}
                    onChange={handleInputChange}
                  />
                  <span>Hemen Göster</span>
                </label>
                
                <label className="schedule-option">
                  <input
                    type="radio"
                    name="scheduleType"
                    value="scheduled"
                    checked={newSurprise.scheduleType === 'scheduled'}
                    onChange={handleInputChange}
                  />
                  <span>Zamanlanmış Göster</span>
                </label>
              </div>
              
              {newSurprise.scheduleType === 'scheduled' && (
                <input
                  type="datetime-local"
                  name="scheduleTime"
                  value={newSurprise.scheduleTime || ''}
                  onChange={handleInputChange}
                  className="surprise-datetime"
                />
              )}
              

              <button
                className="surprise-add-btn"
                onClick={handleAddSurprise}
                disabled={!newSurprise.message.trim()}
              >
                Sürpriz Oluştur 💖
              </button>
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="surprise-history-section">
            <h3>Sürpriz Geçmişi</h3>
            {surprises.length === 0 ? (
              <p className="no-surprises">Henüz sürpriz oluşturulmamış</p>
            ) : (
              <div className="surprise-history-list">
                {surprises.map(surprise => {
                  const typeInfo = getSurpriseTypeInfo(surprise.type)
                  
                  return (
                    <div
                      key={surprise._id}
                      className={`surprise-history-item ${surprise.delivered ? 'delivered' : ''}`}
                    >
                      <div className="surprise-history-header">
                        <span className="surprise-history-type">
                          {typeInfo.icon} {typeInfo.name}
                        </span>
                        <span className={`surprise-history-status ${surprise.delivered ? 'delivered' : 'pending'}`}>
                          {surprise.delivered ? 'Gösterildi' : 'Beklemede'}
                        </span>
                      </div>
                      
                      <p className="surprise-history-message">{surprise.message}</p>
                      
                      <div className="surprise-history-footer">
                        <span className="surprise-history-user">
                          {surprise.userId?.profile?.gender === 'female' ? '👩 Sen' : '👨 Aşkım'}
                        </span>
                        <span className="surprise-history-date">
                          Oluşturuldu: {formatDate(surprise.createdAt)}
                        </span>
                        {surprise.scheduleTime && (
                          <span className="surprise-history-scheduled">
                            Zamanlandı: {formatDate(surprise.scheduleTime)}
                          </span>
                        )}
                        <span className="surprise-history-schedule-type">
                          {formatScheduleType(surprise.scheduleType)}
                        </span>
                      </div>
                      
                      {!surprise.delivered && surprise.scheduleType === 'scheduled' && (
                        <button
                          className="surprise-show-btn"
                          onClick={() => showSurpriseNotification(surprise)}
                        >
                          Şimdi Göster
                        </button>
                      )}
                      <button
                        className="surprise-delete-btn"
                        onClick={async () => {
                          try {
                            await surpriseService.delete(surprise._id)
                            setSurprises(prev => prev.filter(s => s._id !== surprise._id))
                          } catch (error) {
                            console.error('Error deleting surprise:', error)
                          }
                        }}
                      >
                        Sil
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification overlay */}
      {showNotification && (
        <div className="surprise-notification-overlay">
          <div className="surprise-notification-content">
            <CloseButton 
              onClick={() => {
                setShowNotification(null)
                if (onNotificationHide) onNotificationHide()
              }}
              variant="overlay"
              size="small"
              className="surprise-notification-close"
              ariaLabel="Bildirimi kapat"
            />
            
            <div className="surprise-notification-header">
              {(() => {
                const typeInfo = getSurpriseTypeInfo(showNotification.type)
                return (
                  <>
                    <span className="surprise-notification-icon">{typeInfo.icon}</span>
                    <h3 className="surprise-notification-title">{typeInfo.name} Sürprizi!</h3>
                  </>
                )
              })()}
            </div>
            
            <div className="surprise-notification-body">
              <p className="surprise-notification-message">{showNotification.message}</p>
            </div>
            
            <div className="surprise-notification-footer">
              <p className="surprise-notification-date">
                {formatDate(showNotification.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SurpriseNotifications