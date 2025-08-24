import React, { useState, useEffect } from 'react';
import { planningService } from '../../services/api';

import { useSocket } from '../../hooks/useSocket';
import './SharedPlanning.css';

const SharedPlanning = ({ channelId }) => {
  // Use demo user for shared component
  const user = { id: 'demo-user', name: 'Demo User' };
  const { socket } = useSocket();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: ''
  });
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerTypingTimeout, setPartnerTypingTimeout] = useState(null);

  // Fetch events for the channel
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const channelEvents = await planningService.getEventsByChannel(channelId);
        const normalized = Array.isArray(channelEvents) ? channelEvents : (channelEvents?.data ?? []);
        setEvents(normalized);
        setError(null);
      } catch (err) {
        setError('Etkinlikler yüklenemedi');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      fetchEvents();
    }
  }, [channelId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new events
    socket.on('eventAdded', (newEvent) => {
      setEvents(prevEvents => [newEvent, ...prevEvents]);
    });

    // Listen for event updates
    socket.on('eventUpdated', (updatedEvent) => {
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event._id === updatedEvent._id ? updatedEvent : event
        )
      );
    });

    // Listen for event deletions
    socket.on('eventDeleted', (eventId) => {
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
    });

    // Listen for typing indicators
    socket.on('planningTyping', ({ userId, isTyping }) => {
      if (userId !== user.id) {
        setPartnerTyping(isTyping);
        
        // Clear any existing timeout
        if (partnerTypingTimeout) {
          clearTimeout(partnerTypingTimeout);
        }
        
        // Set timeout to clear typing indicator
        if (isTyping) {
          const timeout = setTimeout(() => {
            setPartnerTyping(false);
          }, 3000);
          setPartnerTypingTimeout(timeout);
        }
      }
    });

    // Listen for partner presence
    socket.on('partnerJoined', () => {
      console.log('Partner joined the planning channel');
    });

    socket.on('partnerLeft', () => {
      console.log('Partner left the planning channel');
      setPartnerTyping(false);
    });

    // Join the planning channel
    if (channelId) {
      socket.emit('joinChannel', { channelId, userId: user.id });
    }

    // Cleanup
    return () => {
      socket.off('eventAdded');
      socket.off('eventUpdated');
      socket.off('eventDeleted');
      socket.off('planningTyping');
      socket.off('partnerJoined');
      socket.off('partnerLeft');
      
      // Leave the channel
      if (channelId) {
        socket.emit('leaveChannel', { channelId, userId: user.id });
      }
      
      // Clear timeout
      if (partnerTypingTimeout) {
        clearTimeout(partnerTypingTimeout);
      }
    };
  }, [socket, channelId, user.id, partnerTypingTimeout]);

  // Handle event submission
  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    
    if (!newEvent.title.trim() || !newEvent.date) {
      setError('Lütfen etkinlik başlığı ve tarihi girin');
      return;
    }
    
    try {
      const eventData = {
        title: newEvent.title.trim(),
        description: newEvent.description.trim(),
        date: newEvent.date,
        time: newEvent.time || null,
        location: newEvent.location.trim() || null,
        channelId: channelId
      };
      
      const newEventResponse = await planningService.createEvent(eventData);
      
      // Emit socket event for real-time update
      socket.emit('addEvent', newEventResponse);
      
      // Clear form
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        location: ''
      });
      setError(null);
    } catch (err) {
      setError('Etkinlik eklenemedi');
      console.error('Error submitting event:', err);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (socket) {
      socket.emit('planningTyping', { channelId, userId: user.id, isTyping: true });
    }
  };

  // Handle typing stop
  const handleTypingStop = () => {
    if (socket) {
      socket.emit('planningTyping', { channelId, userId: user.id, isTyping: false });
    }
  };

  // Delete an event
  const deleteEvent = async (eventId) => {
    try {
      await planningService.deleteEvent(eventId);
      
      // Remove from local state
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventId));
      
      // Emit socket event for real-time update
      socket.emit('deleteEvent', eventId);
    } catch (err) {
      setError('Etkinlik silinemedi');
      console.error('Error deleting event:', err);
    }
  };

  if (loading) {
    return (
      <div className="shared-planning">
        <div className="planning-loading">Planlanan etkinlikler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="shared-planning">
      <h2 className="planning-title">Birlikte Planladığımız Şeyler</h2>
      
      {error && (
        <div className="planning-error">{error}</div>
      )}
      
      {/* Add new event form */}
      <div className="add-event-section">
        <h3 className="add-event-title">Yeni Etkinlik Planla</h3>
        
        <form className="add-event-form" onSubmit={handleSubmitEvent}>
          <input
            type="text"
            className="event-input"
            placeholder="Etkinlik başlığı"
            value={newEvent.title}
            onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
            onFocus={handleTyping}
            onBlur={handleTypingStop}
          />
          
          <textarea
            className="event-textarea"
            placeholder="Etkinlik açıklaması (isteğe bağlı)"
            value={newEvent.description}
            onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
            onFocus={handleTyping}
            onBlur={handleTypingStop}
            maxLength={280}
          />
          
          <div className="event-form-row">
            <input
              type="date"
              className="event-date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
              onFocus={handleTyping}
              onBlur={handleTypingStop}
            />
            
            <input
              type="time"
              className="event-time"
              value={newEvent.time}
              onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
              onFocus={handleTyping}
              onBlur={handleTypingStop}
            />
          </div>
          
          <input
            type="text"
            className="event-input"
            placeholder="Yer (isteğe bağlı)"
            value={newEvent.location}
            onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
            onFocus={handleTyping}
            onBlur={handleTypingStop}
          />
          
          <button type="submit" className="event-submit-btn">
            Etkinlik Planla
          </button>
          
          {partnerTyping && (
            <div className="partner-typing">
              📅 Partnerin etkinlik planlıyor...
            </div>
          )}
        </form>
      </div>
      
      {/* Event list */}
      <div className="events-list">
        <h3 className="events-list-title">Planlanan Etkinlikler</h3>
        
        {events.length === 0 ? (
          <div className="no-events">Henüz etkinlik planlanmamış</div>
        ) : (
          <div className="events-container">
            {events.map((event) => {
              const eventDate = new Date(event.date);
              const today = new Date();
              const isPast = eventDate < today;
              const isToday = eventDate.toDateString() === today.toDateString();
              
              return (
                <div 
                  key={event._id} 
                  className={`event-item ${isPast ? 'past' : ''} ${isToday ? 'today' : ''}`}
                >
                  <div className="event-header">
                    <div className="event-date-display">
                      <span className="event-day">
                        {eventDate.toLocaleDateString('tr-TR', { day: '2-digit' })}
                      </span>
                      <span className="event-month">
                        {eventDate.toLocaleDateString('tr-TR', { month: 'short' })}
                      </span>
                    </div>
                    
                    <div className="event-actions">
                      <button 
                        className="event-action-btn delete-btn"
                        onClick={() => deleteEvent(event._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="event-content">
                    <h4 className="event-title">{event.title}</h4>
                    
                    {event.time && (
                      <p className="event-time">
                        🕐 {event.time}
                      </p>
                    )}
                    
                    {event.location && (
                      <p className="event-location">
                        📍 {event.location}
                      </p>
                    )}
                    
                    {event.description && (
                      <p className="event-description">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="event-footer">
                      <span className="event-user">
                        {event.user.username}
                      </span>
                      <span className="event-created">
                        Eklendi: {new Date(event.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
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

export default SharedPlanning;