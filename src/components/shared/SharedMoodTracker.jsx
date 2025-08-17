import React, { useState, useEffect } from 'react';
import { moodService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './SharedMoodTracker.css';

const SharedMoodTracker = () => {
  const { user } = useAuth();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMood, setSelectedMood] = useState('');
  const [message, setMessage] = useState('');
  const [gender, setGender] = useState('');

  // Mood options with emojis and labels
  const moodOptions = [
    { value: 'happy', emoji: '😊', label: 'Mutlu' },
    { value: 'excited', emoji: '🤩', label: 'Heyecanlı' },
    { value: 'love', emoji: '🥰', label: 'Aşık' },
    { value: 'grateful', emoji: '🙏', label: 'Minnettar' },
    { value: 'peaceful', emoji: '😌', label: 'Huzurlu' },
    { value: 'sad', emoji: '😢', label: 'Üzgün' },
    { value: 'angry', emoji: '😠', label: 'Kızgın' },
    { value: 'anxious', emoji: '😰', label: 'Endişeli' },
    { value: 'tired', emoji: '😴', label: 'Yorgun' },
    { value: 'sick', emoji: '🤒', label: 'Hasta' }
  ];

  // Fetch moods
  useEffect(() => {
    const fetchMoods = async () => {
      try {
        setLoading(true);
        const allMoods = await moodService.getAll();
        setMoods(allMoods);
        setError(null);
      } catch (err) {
        setError('Ruh hali geçmişi yüklenemedi');
        console.error('Error fetching moods:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMoods();
  }, []);

  // Handle mood submission
  const handleSubmitMood = async (e) => {
    e.preventDefault();
    
    if (!selectedMood || !message.trim() || !gender) {
      setError('Lütfen ruh halinizi, mesajınızı ve cinsiyetinizi seçin');
      return;
    }
    
    try {
      const moodData = {
        mood: selectedMood,
        message: message.trim(),
        gender: gender
      };
      
      const newMood = await moodService.create(moodData);
      
      // Add new mood to the list
      setMoods(prevMoods => [newMood, ...prevMoods]);
      
      // Clear form
      setSelectedMood('');
      setMessage('');
      setGender('');
      setError(null);
    } catch (err) {
      setError('Ruh hali kaydedilemedi');
      console.error('Error submitting mood:', err);
    }
  };

  // Get mood emoji and label
  const getMoodInfo = (moodValue) => {
    return moodOptions.find(option => option.value === moodValue) ||
           { emoji: '❓', label: 'Bilinmiyor' };
  };

  if (loading) {
    return (
      <div className="shared-mood-tracker">
        <div className="mood-loading">Ruh hali geçmişi yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="shared-mood-tracker">
      <h2 className="mood-title">Ruh Halimizi Paylaşalım</h2>
      
      {error && (
        <div className="mood-error">{error}</div>
      )}
      
      {/* Mood submission form */}
      <form className="mood-form" onSubmit={handleSubmitMood}>
        <div className="mood-options">
          {moodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`mood-option ${selectedMood === option.value ? 'selected' : ''}`}
              onClick={() => setSelectedMood(option.value)}
            >
              <span className="mood-emoji">{option.emoji}</span>
              <span className="mood-label">{option.label}</span>
            </button>
          ))}
        </div>
        
        <div className="gender-selection">
          <h3>Cinsiyet Seçimi</h3>
          <div className="gender-options">
            <button
              type="button"
              className={`gender-option ${gender === 'female' ? 'selected' : ''}`}
              onClick={() => setGender('female')}
            >
              <span className="gender-emoji">👩</span>
              <span className="gender-label">Kadın</span>
            </button>
            <button
              type="button"
              className={`gender-option ${gender === 'male' ? 'selected' : ''}`}
              onClick={() => setGender('male')}
            >
              <span className="gender-emoji">👨</span>
              <span className="gender-label">Erkek</span>
            </button>
          </div>
        </div>
        
        <textarea
          className="mood-message"
          placeholder="Bugün ruh halin nasıl? Neden böyle hissediyorsun?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={280}
        />
        
        <button type="submit" className="mood-submit-btn" disabled={!selectedMood || !message.trim() || !gender}>
          Ruh Halimi Kaydet
        </button>
      </form>
      
      {/* Mood history */}
      <div className="mood-history">
        <h3 className="mood-history-title">Ruh Hali Geçmişi</h3>
        
        {moods.length === 0 ? (
          <div className="no-moods">Henüz ruh hali kaydı bulunmuyor</div>
        ) : (
          <div className="moods-list">
            {moods.map((mood) => {
              const moodInfo = getMoodInfo(mood.mood);
              return (
                <div key={mood._id} className="mood-entry">
                  <div className="mood-header">
                    <span className="mood-user">
                      {mood.gender === 'female' ? '👩 Kadın' :
                       mood.gender === 'male' ? '👨 Erkek' :
                       '👤 Diğer'}
                    </span>
                    <span className="mood-emoji">{moodInfo.emoji}</span>
                    <span className="mood-label">{moodInfo.label}</span>
                    <span className="mood-date">
                      {new Date(mood.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <div className="mood-content">
                    {mood.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedMoodTracker;