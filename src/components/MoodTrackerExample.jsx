import { useState, useEffect } from 'react';
import { moodService } from '../services/api';

const MoodTracker = () => {
  const [moods, setMoods] = useState([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [message, setMessage] = useState('');
  const [gender, setGender] = useState(''); // 'female', 'male', or 'other'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Moods with emojis
  const moodOptions = [
    { value: 'happy', label: 'Mutlu', emoji: '😊' },
    { value: 'sad', label: 'Üzgün', emoji: '😢' },
    { value: 'angry', label: 'Sinirli', emoji: '😠' },
    { value: 'excited', label: 'Heyecanlı', emoji: '🤩' },
    { value: 'tired', label: 'Yorgun', emoji: '😴' },
    { value: 'calm', label: 'Sakin', emoji: '😌' },
    { value: 'anxious', label: 'Endişeli', emoji: '😰' },
    { value: 'grateful', label: 'Minnettar', emoji: '🙏' }
  ];

  // Get mood emoji
  const getMoodEmoji = (moodValue) => {
    const mood = moodOptions.find(m => m.value === moodValue);
    return mood ? mood.emoji : '😊';
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Load moods from API
  useEffect(() => {
    loadMoods();
  }, []);

  const loadMoods = async () => {
    try {
      setLoading(true);
      const data = await moodService.getAll();
      setMoods(data);
    } catch (err) {
      setError('Ruh halleri yüklenirken bir hata oluştu');
      console.error('Error loading moods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoodSubmit = async () => {
    if (!selectedMood || !gender) return;

    try {
      setLoading(true);
      const newMood = {
        mood: selectedMood,
        message: message,
        gender: gender
      };

      const data = await moodService.create(newMood);
      
      // Add to local state
      setMoods(prev => [data, ...prev]);
      setSelectedMood('');
      setMessage('');
      setGender('');
    } catch (err) {
      setError('Ruh hali kaydedilirken bir hata oluştu');
      console.error('Error saving mood:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mood-tracker-container">
      <div className="mood-tracker-header">
        <h2 className="mood-tracker-title">💕 Ortak Ruh Halimiz 💕</h2>
        <p className="mood-tracker-subtitle">Birbirimize olan duygularımızı paylaşalım</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="mood-tracker-form">
        <h3>Bugünkü Ruh Halin Nedir?</h3>
        <div className="mood-options">
          {moodOptions.map((mood) => (
            <button
              key={mood.value}
              className={`mood-option ${selectedMood === mood.value ? 'selected' : ''}`}
              onClick={() => setSelectedMood(mood.value)}
            >
              <span className="mood-emoji">{mood.emoji}</span>
              <span className="mood-label">{mood.label}</span>
            </button>
          ))}
        </div>

        <div className="mood-gender-selection">
          <h3>Cinsiyet Seçimi</h3>
          <div className="gender-options">
            <button
              className={`gender-option ${gender === 'female' ? 'selected' : ''}`}
              onClick={() => setGender('female')}
            >
              <span className="gender-emoji">👩</span>
              <span className="gender-label">mermi</span>
            </button>
            <button
              className={`gender-option ${gender === 'male' ? 'selected' : ''}`}
              onClick={() => setGender('male')}
            >
              <span className="gender-emoji">👨</span>
              <span className="gender-label">yusuf</span>
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
          disabled={!selectedMood || !gender || loading}
        >
          {loading ? 'Kaydediliyor...' : 'Ruh Halini Kaydet 💖'}
        </button>
      </div>

      <div className="mood-history">
        <h3>Geçmiş Ruh Halleri</h3>
        {loading && moods.length === 0 ? (
          <p className="loading-text">Ruh halleri yükleniyor...</p>
        ) : moods.length === 0 ? (
          <p className="no-moods">Henüz ruh hali eklenmemiş</p>
        ) : (
          <div className="mood-history-list">
            {moods.map((mood) => (
              <div key={mood._id} className="mood-history-item">
                <div className="mood-history-header">
                  <span className="mood-history-emoji">{getMoodEmoji(mood.mood)}</span>
                  <div className="mood-history-info">
                    <span className="mood-history-user">
                      {mood.gender === 'female' ? '👩 mermi' :
                       mood.gender === 'male' ? '👨 yusuf' :
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
  );
};

export default MoodTracker;