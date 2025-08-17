import { useState, useEffect } from 'react'
import { moodService } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const MoodTracker = () => {
  const [moods, setMoods] = useState([])
  const [selectedMood, setSelectedMood] = useState('')
  const [message, setMessage] = useState('')
  const [gender, setGender] = useState('') // 'female', 'male', or 'other'
  const [view, setView] = useState('log') // 'log' or 'history'
  const { checkTokenValidity } = useAuth()

  // Mood options with emojis
  const moodOptions = [
    { id: 'happy', emoji: '😊', label: 'Mutlu' },
    { id: 'sad', emoji: '😢', label: 'Üzgün' },
    { id: 'angry', emoji: '😠', label: 'Kızgın' },
    { id: 'excited', emoji: '😍', label: 'Heyecanlı' },
    { id: 'tired', emoji: '😴', label: 'Yorgun' },
    { id: 'calm', emoji: '😌', label: 'Sakin' },
    { id: 'anxious', emoji: '😰', label: 'Endişeli' },
    { id: 'grateful', emoji: '🙏', label: 'Minnettar' }
  ]

  // Load moods from API on component mount
  useEffect(() => {
    const loadMoods = async () => {
      try {
        console.log('Attempting to load moods...');
        
        // Check token validity first
        const isValid = await checkTokenValidity();
        if (!isValid) {
          console.log('Token is not valid, attempting to load moods anyway');
          // Don't return here, try to load moods anyway
        }
        
        const data = await moodService.getAll();
        console.log('Data received from moodService.getAll():', data);
        
        if (data) {
          setMoods(data);
          console.log('Moods loaded successfully:', data.length);
        } else {
          console.log('No data received from moodService.getAll()');
        }
      } catch (error) {
        console.error('Error loading moods:', error);
        console.error('Error details:', error.message, error.stack);
      }
    };
    
    loadMoods();
  }, [checkTokenValidity])

  const handleMoodSubmit = async () => {
    if (!selectedMood || !gender) return

    try {
      // Check token validity first (skip in development)
      if (!import.meta.env.DEV && localStorage.getItem('bypass_auth') !== 'true') {
        const isValid = await checkTokenValidity();
        if (!isValid) {
          console.log('Token is not valid, skipping mood save');
          return;
        }
      }
      
      const moodData = {
        mood: selectedMood,
        message: message,
        gender: gender // Using gender instead of user
      }

      const data = await moodService.create(moodData)
      if (data) {
        setMoods(prev => [data, ...prev])
        setSelectedMood('')
        setMessage('')
        setGender('')
      }
    } catch (error) {
      console.error('Error saving mood:', error)
    }
  }

  const getMoodEmoji = (moodId) => {
    const mood = moodOptions.find(m => m.id === moodId)
    return mood ? mood.emoji : '❓'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get mood counts for visualization
  const getMoodCounts = () => {
    const counts = {}
    moodOptions.forEach(mood => {
      counts[mood.id] = 0
    })
    
    moods.forEach(mood => {
      if (counts[mood.mood] !== undefined) {
        counts[mood.mood]++
      }
    })
    
    return counts
  }

  const moodCounts = getMoodCounts()

  return (
    <div className="mood-tracker-container">
      <div className="mood-tracker-header">
        <h2 className="mood-tracker-title">💕 Ruh Halimizi Takip Edelim 💕</h2>
        <p className="mood-tracker-subtitle">Bugünkü ruh halini paylaş ve geçmişe bak</p>
      </div>

      <div className="mood-tracker-tabs">
        <button 
          className={`mood-tab ${view === 'log' ? 'active' : ''}`}
          onClick={() => setView('log')}
        >
          Ruh Halini Kaydet
        </button>
        <button 
          className={`mood-tab ${view === 'history' ? 'active' : ''}`}
          onClick={() => setView('history')}
        >
          Geçmiş Ruh Halleri
        </button>
      </div>

      {view === 'log' && (
        <div className="mood-log-section">
          <div className="mood-selection">
            <h3>Günün Ruh Hali</h3>
            <div className="mood-options">
              {moodOptions.map((mood) => (
                <button
                  key={mood.id}
                  className={`mood-option ${selectedMood === mood.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMood(mood.id)}
                >
                  <span className="mood-emoji">{mood.emoji}</span>
                  <span className="mood-label">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mood-gender-selection">
            <h3>Cinsiyet Seçimi</h3>
            <div className="gender-options">
              <button
                className={`gender-option ${gender === 'female' ? 'selected' : ''}`}
                onClick={() => setGender('female')}
              >
                <span className="gender-emoji">👩</span>
                <span className="gender-label">Kadın</span>
              </button>
              <button
                className={`gender-option ${gender === 'male' ? 'selected' : ''}`}
                onClick={() => setGender('male')}
              >
                <span className="gender-emoji">👨</span>
                <span className="gender-label">Erkek</span>
              </button>
              <button
                className={`gender-option ${gender === 'other' ? 'selected' : ''}`}
                onClick={() => setGender('other')}
              >
                <span className="gender-emoji">👤</span>
                <span className="gender-label">Diğer</span>
              </button>
            </div>
          </div>

          <div className="mood-message">
            <h3>Mesajını Ekle (İsteğe Bağlı)</h3>
            <textarea
              className="mood-textarea"
              placeholder="Bugün seni ne düşündürüyor?..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="3"
            />
          </div>


          <button
            className="mood-submit-btn"
            onClick={handleMoodSubmit}
            disabled={!selectedMood || !gender}
          >
            Ruh Halini Kaydet 💖
          </button>
        </div>
      )}

      {view === 'history' && (
        <div className="mood-history-section">
          <div className="mood-visualization">
            <h3>Ruh Hali Dağılımı</h3>
            <div className="mood-chart">
              {moodOptions.map((mood) => (
                <div key={mood.id} className="mood-bar-container">
                  <div 
                    className="mood-bar"
                    style={{ 
                      height: `${(moodCounts[mood.id] / Math.max(1, moods.length)) * 100}%`,
                      backgroundColor: mood.id === 'happy' ? '#ff6b6b' : 
                                     mood.id === 'sad' ? '#4d9de0' : 
                                     mood.id === 'angry' ? '#ff9f1c' : 
                                     mood.id === 'excited' ? '#7bff7b' : 
                                     mood.id === 'tired' ? '#b5b5b5' : 
                                     mood.id === 'calm' ? '#a29bfe' : 
                                     mood.id === 'anxious' ? '#fd79a8' : 
                                     '#fdcb6e'
                    }}
                  />
                  <div className="mood-bar-label">
                    <span className="mood-bar-emoji">{mood.emoji}</span>
                    <span className="mood-bar-count">{moodCounts[mood.id]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mood-history">
            <h3>Son Ruh Halleri</h3>
            {moods.length === 0 ? (
              <p className="no-moods">Henüz ruh hali kaydedilmedi</p>
            ) : (
              <div className="mood-history-list">
                {moods.map((mood) => (
                  <div key={mood.id} className="mood-history-item">
                    <div className="mood-history-header">
                      <span className="mood-history-emoji">{getMoodEmoji(mood.mood)}</span>
                      <div className="mood-history-info">
                        <span className="mood-history-user">
                          {mood.gender === 'female' ? '👩 Kadın' :
                           mood.gender === 'male' ? '👨 Erkek' :
                           '👤 Diğer'}
                        </span>
                        <span className="mood-history-date">{formatDate(mood.createdAt)}</span>
                        <span className="mood-history-time">{formatTime(mood.createdAt)}</span>
                      </div>
                    </div>
                    {mood.message && (
                      <p className="mood-history-message">{mood.message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MoodTracker