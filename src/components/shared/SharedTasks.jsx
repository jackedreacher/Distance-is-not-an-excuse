import React, { useState, useEffect } from 'react';
import { taskService } from '../../services/api';

import { useSocket } from '../../hooks/useSocket';
import './SharedTasks.css';

const SharedTasks = ({ channelId }) => {
  // Use demo user for shared component
  const user = { id: 'demo-user', name: 'Demo User' };
  const { socket } = useSocket();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerTypingTimeout, setPartnerTypingTimeout] = useState(null);

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Düşük', color: '#7bed9f' },
    { value: 'medium', label: 'Orta', color: '#ffa502' },
    { value: 'high', label: 'Yüksek', color: '#ff4757' }
  ];

  // Fetch tasks for the channel
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const channelTasks = await taskService.getTasksByChannel(channelId);
        setTasks(channelTasks);
        setError(null);
      } catch (err) {
        setError('Görevler yüklenemedi');
        console.error('Error fetching tasks:', err);
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      fetchTasks();
    }
  }, [channelId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new tasks
    socket.on('taskAdded', (newTask) => {
      setTasks(prevTasks => [newTask, ...prevTasks]);
    });

    // Listen for task updates
    socket.on('taskUpdated', (updatedTask) => {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        )
      );
    });

    // Listen for task deletions
    socket.on('taskDeleted', (taskId) => {
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
    });

    // Listen for typing indicators
    socket.on('taskTyping', ({ userId, isTyping }) => {
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
      console.log('Partner joined the tasks channel');
    });

    socket.on('partnerLeft', () => {
      console.log('Partner left the tasks channel');
      setPartnerTyping(false);
    });

    // Join the tasks channel
    if (channelId) {
      socket.emit('joinChannel', { channelId, userId: user.id });
    }

    // Cleanup
    return () => {
      socket.off('taskAdded');
      socket.off('taskUpdated');
      socket.off('taskDeleted');
      socket.off('taskTyping');
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

  // Handle task submission
  const handleSubmitTask = async (e) => {
    e.preventDefault();
    
    if (!newTask.title.trim()) {
      setError('Lütfen görev başlığı girin');
      return;
    }
    
    try {
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        dueDate: newTask.dueDate || null,
        channelId: channelId
      };
      
      const newTaskResponse = await taskService.createTask(taskData);
      
      // Emit socket event for real-time update
      socket.emit('addTask', newTaskResponse);
      
      // Clear form
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: ''
      });
      setError(null);
    } catch (err) {
      setError('Görev eklenemedi');
      console.error('Error submitting task:', err);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (socket) {
      socket.emit('taskTyping', { channelId, userId: user.id, isTyping: true });
    }
  };

  // Handle typing stop
  const handleTypingStop = () => {
    if (socket) {
      socket.emit('taskTyping', { channelId, userId: user.id, isTyping: false });
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (taskId) => {
    try {
      const taskToUpdate = tasks.find(task => task._id === taskId);
      if (!taskToUpdate) return;
      
      const updatedTaskData = {
        ...taskToUpdate,
        completed: !taskToUpdate.completed,
        completedAt: !taskToUpdate.completed ? new Date().toISOString() : null
      };
      
      const updatedTask = await taskService.updateTask(taskId, updatedTaskData);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? updatedTask : task
        )
      );
      
      // Emit socket event for real-time update
      socket.emit('updateTask', updatedTask);
    } catch (err) {
      setError('Görev durumu güncellenemedi');
      console.error('Error updating task:', err);
    }
  };

  // Delete a task
  const deleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      
      // Remove from local state
      setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
      
      // Emit socket event for real-time update
      socket.emit('deleteTask', taskId);
    } catch (err) {
      setError('Görev silinemedi');
      console.error('Error deleting task:', err);
    }
  };

  // Get priority info
  const getPriorityInfo = (priorityValue) => {
    return priorityOptions.find(option => option.value === priorityValue) || 
           priorityOptions[1]; // Default to medium
  };

  if (loading) {
    return (
      <div className="shared-tasks">
        <div className="tasks-loading">Görevler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="shared-tasks">
      <h2 className="tasks-title">Ortak Görevlerimiz</h2>
      
      {error && (
        <div className="tasks-error">{error}</div>
      )}
      
      {/* Add new task form */}
      <div className="add-task-section">
        <h3 className="add-task-title">Yeni Görev Ekle</h3>
        
        <form className="add-task-form" onSubmit={handleSubmitTask}>
          <input
            type="text"
            className="task-input"
            placeholder="Görev başlığı"
            value={newTask.title}
            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            onFocus={handleTyping}
            onBlur={handleTypingStop}
          />
          
          <textarea
            className="task-textarea"
            placeholder="Görev açıklaması (isteğe bağlı)"
            value={newTask.description}
            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            onFocus={handleTyping}
            onBlur={handleTypingStop}
            maxLength={280}
          />
          
          <div className="task-form-row">
            <select
              className="task-select"
              value={newTask.priority}
              onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} Öncelik
                </option>
              ))}
            </select>
            
            <input
              type="date"
              className="task-date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
            />
          </div>
          
          <button type="submit" className="task-submit-btn">
            Görev Ekle
          </button>
          
          {partnerTyping && (
            <div className="partner-typing">
              ✅ Partnerin görev ekliyor...
            </div>
          )}
        </form>
      </div>
      
      {/* Task list */}
      <div className="tasks-list">
        <h3 className="tasks-list-title">Görev Listesi</h3>
        
        {tasks.length === 0 ? (
          <div className="no-tasks">Henüz görev eklenmemiş</div>
        ) : (
          <div className="tasks-container">
            {tasks.map((task) => {
              const priorityInfo = getPriorityInfo(task.priority);
              const isOverdue = task.dueDate && !task.completed && 
                               new Date(task.dueDate) < new Date();
              
              return (
                <div 
                  key={task._id} 
                  className={`task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
                >
                  <div className="task-header">
                    <div className="task-info">
                      <span 
                        className="task-priority"
                        style={{ backgroundColor: priorityInfo.color }}
                      >
                        {priorityInfo.label} Öncelik
                      </span>
                      {task.dueDate && (
                        <span className={`task-due-date ${isOverdue ? 'overdue' : ''}`}>
                          {new Date(task.dueDate).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                    </div>
                    
                    <div className="task-actions">
                      <button 
                        className="task-action-btn toggle-btn"
                        onClick={() => toggleTaskCompletion(task._id)}
                      >
                        {task.completed ? '↩️' : '✅'}
                      </button>
                      <button 
                        className="task-action-btn delete-btn"
                        onClick={() => deleteTask(task._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="task-title">{task.title}</h4>
                  
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  
                  <div className="task-footer">
                    <span className="task-user">
                      {task.user.username}
                    </span>
                    <span className="task-date">
                      Eklendi: {new Date(task.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                    {task.completed && task.completedAt && (
                      <span className="task-completed">
                        ✅ Tamamlandı: {new Date(task.completedAt).toLocaleDateString('tr-TR')}
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

export default SharedTasks;