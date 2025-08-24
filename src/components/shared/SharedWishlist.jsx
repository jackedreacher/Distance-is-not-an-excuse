import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import './SharedWishlist.css';

const SharedWishlist = ({ channelId, roomId }) => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    title: '',
    category: 'restaurants',
    description: '',
    priority: 'medium',
  });
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { socket, updateContent, startTyping, stopTyping } = useSocket();

  // Load wishlist items
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would fetch from the backend
        // For now, we'll use mock data
        const mockItems = [
          {
            _id: '1',
            title: 'Romantik akşam yemeği',
            category: 'restaurants',
            description: 'Bosphorus\'ta denize sıfır bir restoran',
            priority: 'high',
            completed: false,
            createdBy: { username: 'Aşkım' },
            createdAt: new Date().toISOString()
          }
        ];
        setItems(mockItems);
      } catch (error) {
        console.error('Error loading wishlist:', error);
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      loadWishlist();
    }
  }, [channelId]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleContentUpdated = (data) => {
      if (data.channelId === channelId) {
        // Update local state with new/updated item
        setItems(prev => {
          const existingIndex = prev.findIndex(item => item._id === data.item._id);
          if (existingIndex >= 0) {
            const newItems = [...prev];
            newItems[existingIndex] = data.item;
            return newItems;
          } else {
            return [data.item, ...prev];
          }
        });
      }
    };

    const handleUserTyping = (data) => {
      if (data.channelId === channelId) {
        setTypingUsers(prev => {
          const existingIndex = prev.findIndex(user => user.userId === data.userId);
          if (existingIndex >= 0) {
            const newUsers = [...prev];
            newUsers[existingIndex] = data;
            return newUsers;
          } else {
            return [...prev, data];
          }
        });
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.channelId === channelId) {
        setTypingUsers(prev => 
          prev.filter(user => user.userId !== data.userId)
        );
      }
    };

    socket.on('contentUpdated', handleContentUpdated);
    socket.on('userTyping', handleUserTyping);
    socket.on('userStopTyping', handleUserStopTyping);

    return () => {
      socket.off('contentUpdated', handleContentUpdated);
      socket.off('userTyping', handleUserTyping);
      socket.off('userStopTyping', handleUserStopTyping);
    };
  }, [socket, channelId]);

  const handleAddItem = async () => {
    if (!newItem.title.trim()) return;

    try {
      // In a real implementation, this would save to the backend
      const itemData = {
        ...newItem,
        channelId,
        completed: false,
        _id: Date.now().toString(), // Mock ID
        createdBy: { username: 'Sen' }, // Mock user
        createdAt: new Date().toISOString()
      };

      // Notify other users of the new item
      updateContent({
        type: 'wishlistItemAdded',
        roomId,
        channelId,
        item: itemData
      });

      setItems(prev => [itemData, ...prev]);
      setNewItem({
        title: '',
        category: 'restaurants',
        description: '',
        priority: 'medium',
      });
    } catch (error) {
      console.error('Error saving wishlist item:', error);
    }
  };

  const toggleCompleted = async (id) => {
    try {
      const itemToUpdate = items.find(item => item._id === id);
      if (itemToUpdate) {
        const updatedData = { 
          ...itemToUpdate, 
          completed: !itemToUpdate.completed,
          completedBy: itemToUpdate.completed ? null : { username: 'Sen' } // Mock user
        };
        
        // Notify other users of the update
        updateContent({
          type: 'wishlistItemUpdated',
          roomId,
          channelId,
          item: updatedData
        });

        setItems(prev => prev.map(item =>
          item._id === id ? updatedData : item
        ));
      }
    } catch (error) {
      console.error('Error updating wishlist item:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }));

    // Send typing indicator
    startTyping({
      roomId,
      channelId,
      field: name
    });
  };

  // Categories for wishlist items
  const categories = [
    { id: 'restaurants', name: 'Restoranlar', icon: '🍽️' },
    { id: 'travel', name: 'Seyahat', icon: '✈️' },
    { id: 'activities', name: 'Aktiviteler', icon: '🎪' },
    { id: 'gifts', name: 'Hediyeler', icon: '🎁' }
  ];

  // Priority levels
  const priorities = [
    { id: 'low', name: 'Düşük', color: '#7bed9f' },
    { id: 'medium', name: 'Orta', color: '#ffa502' },
    { id: 'high', name: 'Yüksek', color: '#ff4757' }
  ];

  const getCategoryInfo = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };

  const getPriorityInfo = (priorityId) => {
    return priorities.find(p => p.id === priorityId) || priorities[1];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Dilek listesi yükleniyor...</div>;
  }

  return (
    <div className="shared-wishlist-container">
      <div className="wishlist-header">
        <h2>💕 Ortak Dilek Listemiz 💕</h2>
        {typingUsers.length > 0 && (
          <div className="typing-indicators">
            {typingUsers.map(user => (
              <span key={user.userId} className="typing-user">
                {user.username || 'Partnerin'} yazıyor...
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="wishlist-form-section">
        <h3>Yeni Dilek Ekle</h3>
        <div className="wishlist-form">
          <input
            type="text"
            name="title"
            placeholder="Dilek başlığı..."
            value={newItem.title}
            onChange={handleInputChange}
            className="wishlist-input"
          />
          
          <select
            name="category"
            value={newItem.category}
            onChange={handleInputChange}
            className="wishlist-select"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
          
          <select
            name="priority"
            value={newItem.priority}
            onChange={handleInputChange}
            className="wishlist-select"
          >
            {priorities.map(priority => (
              <option key={priority.id} value={priority.id}>
                {priority.name} Öncelik
              </option>
            ))}
          </select>
          
          <textarea
            name="description"
            placeholder="Açıklama (isteğe bağlı)..."
            value={newItem.description}
            onChange={handleInputChange}
            className="wishlist-textarea"
            rows="2"
          />
          <button
            className="wishlist-add-btn"
            onClick={handleAddItem}
            disabled={!newItem.title.trim()}
          >
            Dilek Ekle 💖
          </button>
        </div>
      </div>

      <div className="wishlist-items">
        {items.length === 0 ? (
          <p className="no-wishlist-items">Henüz dilek eklenmemiş</p>
        ) : (
          <div className="wishlist-items-list">
            {items.map(item => {
              const categoryInfo = getCategoryInfo(item.category);
              const priorityInfo = getPriorityInfo(item.priority);
              
              return (
                <div
                  key={item._id}
                  className={`wishlist-item ${item.completed ? 'completed' : ''}`}
                >
                  <div className="wishlist-item-header">
                    <div className="wishlist-item-info">
                      <span className="wishlist-item-category">
                        {categoryInfo.icon} {categoryInfo.name}
                      </span>
                      <span
                        className="wishlist-item-priority"
                        style={{ backgroundColor: priorityInfo.color }}
                      >
                        {priorityInfo.name} Öncelik
                      </span>
                    </div>
                    <div className="wishlist-item-actions">
                      <button
                        className="wishlist-item-toggle"
                        onClick={() => toggleCompleted(item._id)}
                      >
                        {item.completed ? 'Geri Al' : 'Tamamlandı'}
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="wishlist-item-title">{item.title}</h3>
                  
                  {item.description && (
                    <p className="wishlist-item-description">{item.description}</p>
                  )}
                  
                  <div className="wishlist-item-footer">
                    <span className="wishlist-item-user">
                      {item.createdBy?.username || 'Kullanıcı'}
                    </span>
                    <span className="wishlist-item-date">
                      Eklendi: {formatDate(item.createdAt)}
                    </span>
                    {item.completed && (
                      <span className="wishlist-item-completed">
                        ✅ Tamamlandı
                      </span>
                    )}
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

export default SharedWishlist;