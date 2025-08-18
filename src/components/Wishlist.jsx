import { useState, useEffect } from 'react'
import { wishlistService } from '../services/api'

const Wishlist = () => {
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState({
    title: '',
    category: 'restaurants',
    description: '',
    priority: 'medium',
    gender: 'female', // Default to female
  })
  const [view, setView] = useState('all') // 'all', 'planned', 'completed'


  // Categories for wishlist items
  const categories = [
    { id: 'restaurants', name: 'Restoranlar', icon: '🍽️' },
    { id: 'travel', name: 'Seyahat', icon: '✈️' },
    { id: 'activities', name: 'Aktiviteler', icon: '🎪' },
    { id: 'gifts', name: 'Hediyeler', icon: '🎁' }
  ]

  // Priority levels
  const priorities = [
    { id: 'low', name: 'Düşük', color: '#7bed9f' },
    { id: 'medium', name: 'Orta', color: '#ffa502' },
    { id: 'high', name: 'Yüksek', color: '#ff4757' }
  ]

  // Load wishlist from API on component mount
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        // Load wishlist directly without authentication
        
        const data = await wishlistService.getAll();
        console.log('Wishlist data received:', data);
        // Backend now returns array directly, not wrapped in items property
        if (Array.isArray(data)) {
          // Add logging to see the structure of each item
          data.forEach((item, index) => {
            console.log(`Wishlist item ${index}:`, {
              id: item._id,
              title: item.title,
              gender: item.gender
            });
          });
          setItems(data);
        }
      } catch (error) {
        console.error('Error loading wishlist:', error);
      }
    };
    
    loadWishlist();
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddItem = async () => {
    if (!newItem.title.trim()) return

    try {
      // Save wishlist item directly without authentication
      
      const itemData = {
        ...newItem,
        completed: false
      }

      const data = await wishlistService.create(itemData)
      // Backend now returns item directly, not wrapped in item property
      if (data && data.title) {
        console.log('New wishlist item created:', {
          id: data._id,
          title: data.title,
          gender: data.gender
        });
        setItems(prev => [data, ...prev])
        setNewItem({
          title: '',
          category: 'restaurants',
          description: '',
          priority: 'medium',
          gender: 'female', // Reset to default
        })
      }
    } catch (error) {
      console.error('Error saving wishlist item:', error)
    }
  }

  const toggleCompleted = async (id) => {
    try {
      // Update wishlist item directly without authentication
      
      const itemToUpdate = items.find(item => item._id === id)
      if (itemToUpdate) {
        const updatedData = { ...itemToUpdate, completed: !itemToUpdate.completed }
        const data = await wishlistService.update(id, updatedData)
        
        // Backend now returns item directly, not wrapped in item property
        if (data && data._id) {
          console.log('Wishlist item updated:', {
            id: data._id,
            title: data.title,
            gender: data.gender
          });
          setItems(prev => prev.map(item =>
            item._id === id ? data : item
          ))
        }
      }
    } catch (error) {
      console.error('Error updating wishlist item:', error)
    }
  }

  const deleteItem = async (id) => {
    try {
      // Delete wishlist item directly without authentication
      
      await wishlistService.delete(id)
      setItems(prev => prev.filter(item => item._id !== id))
    } catch (error) {
      console.error('Error deleting wishlist item:', error)
    }
  }

  const getCategoryInfo = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || categories[0]
  }

  const getPriorityInfo = (priorityId) => {
    return priorities.find(p => p.id === priorityId) || priorities[1]
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Filter items based on view
  const filteredItems = items.filter(item => {
    if (view === 'planned') return !item.completed
    if (view === 'completed') return item.completed
    return true
  })

  // Get statistics
  const stats = {
    total: items.length,
    completed: items.filter(item => item.completed).length,
    planned: items.filter(item => !item.completed).length
  }

  return (
    <div className="wishlist-container">
      <div className="wishlist-header">
        <h2 className="wishlist-title">💕 Ortak Dilek Listemiz 💕</h2>
        <p className="wishlist-subtitle">Birlikte yapmak istediğimiz şeyleri ekleyelim</p>
      </div>

      <div className="wishlist-stats">
        <div className="stat-card">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Toplam</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.planned}</span>
          <span className="stat-label">Planlandı</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.completed}</span>
          <span className="stat-label">Tamamlandı</span>
        </div>
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
         
         <select
           name="gender"
           value={newItem.gender}
           onChange={handleInputChange}
           className="wishlist-select"
         >
           <option value="female">Kadın</option>
           <option value="male">Erkek</option>
         </select>
         
         <button
           className="wishlist-add-btn"
           onClick={handleAddItem}
           disabled={!newItem.title.trim()}
         >
           Dilek Ekle 💖
         </button>
        </div>
      </div>

      <div className="wishlist-tabs">
        <button 
          className={`wishlist-tab ${view === 'all' ? 'active' : ''}`}
          onClick={() => setView('all')}
        >
          Tümü ({items.length})
        </button>
        <button 
          className={`wishlist-tab ${view === 'planned' ? 'active' : ''}`}
          onClick={() => setView('planned')}
        >
          Planlandı ({stats.planned})
        </button>
        <button 
          className={`wishlist-tab ${view === 'completed' ? 'active' : ''}`}
          onClick={() => setView('completed')}
        >
          Tamamlandı ({stats.completed})
        </button>
      </div>

      <div className="wishlist-items">
        {filteredItems.length === 0 ? (
          <p className="no-wishlist-items">
            {view === 'completed' 
              ? 'Henüz tamamlanmış dilek yok' 
              : view === 'planned' 
                ? 'Henüz planlanmış dilek yok' 
                : 'Henüz dilek eklenmemiş'}
          </p>
        ) : (
          <div className="wishlist-items-list">
            {filteredItems.map(item => {
              const categoryInfo = getCategoryInfo(item.category)
              const priorityInfo = getPriorityInfo(item.priority)
              
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
                      <button
                        className="wishlist-item-delete"
                        onClick={() => deleteItem(item._id)}
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="wishlist-item-title">{item.title}</h3>
                  
                  {item.description && (
                    <p className="wishlist-item-description">{item.description}</p>
                  )}
                  
                  <div className="wishlist-item-footer">
                    <span className="wishlist-item-gender">
                      {item.gender === 'female' ? '👩 Kadın' : '👨 Erkek'}
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
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Wishlist