// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Check if backend is available
const isBackendAvailable = () => {
  return true; // Enable backend connection
};

// Fallback responses for when backend is not available
const getFallbackResponse = (type) => {
  switch (type) {
    case 'moods':
      return { success: true, data: [] };
    case 'mood':
      return { success: true, data: { id: Date.now(), mood: 'happy', date: new Date() } };
    case 'tasks':
      return { success: true, data: [] };
    case 'task':
      return { success: true, data: { id: Date.now(), title: 'Demo Task', completed: false } };
    case 'wishlist':
      return { success: true, data: [] };
    case 'music':
      return { success: true, data: [] };
    case 'surprises':
      return { success: true, data: [] };
    default:
      return { success: true, message: 'Demo mode - no backend connected' };
  }
};

// Mood API calls
export const moodService = {
  getAll: async () => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('moods');
    }
    const response = await fetch(`${API_BASE_URL}/moods`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  create: async (moodData) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('mood');
    }
    const response = await fetch(`${API_BASE_URL}/moods`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(moodData)
    });
    return response.json();
  },

  update: async (id, moodData) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('mood');
    }
    const response = await fetch(`${API_BASE_URL}/moods/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(moodData)
    });
    return response.json();
  },

  delete: async (id) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('delete');
    }
    const response = await fetch(`${API_BASE_URL}/moods/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

// Task API calls
export const taskService = {
  createTask: async (taskData) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('task');
    }
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    return response.json();
  },
  
  updateTask: async (id, taskData) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('task');
    }
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });
    return response.json();
  },
  
  deleteTask: async (id) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('delete');
    }
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

// Planning API calls
export const planningService = {
  createEvent: async (eventData) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('event');
    }
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    return response.json();
  },
  
  updateEvent: async (id, eventData) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('event');
    }
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    return response.json();
  },
  
  deleteEvent: async (id) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('delete');
    }
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

// Wishlist API calls
export const wishlistService = {
  getAll: async () => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('wishlist');
    }
    const response = await fetch(`${API_BASE_URL}/wishlist`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  create: async (itemData) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('wishlist');
    }
    const response = await fetch(`${API_BASE_URL}/wishlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(itemData)
    });
    return response.json();
  },

  update: async (id, itemData) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('wishlist');
    }
    const response = await fetch(`${API_BASE_URL}/wishlist/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(itemData)
    });
    return response.json();
  },

  delete: async (id) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('delete');
    }
    const response = await fetch(`${API_BASE_URL}/wishlist/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

// Music API calls
export const musicService = {
  getAll: async () => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('music');
    }
    const response = await fetch(`${API_BASE_URL}/music`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  add: async (songData) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('music');
    }
    const response = await fetch(`${API_BASE_URL}/music`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(songData)
    });
    return response.json();
  },

  update: async (id, songData) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('music');
    }
    const response = await fetch(`${API_BASE_URL}/music/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(songData)
    });
    return response.json();
  },

  delete: async (id) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('delete');
    }
    const response = await fetch(`${API_BASE_URL}/music/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};

// Surprise API calls
export const surpriseService = {
  getAll: async () => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('surprises');
    }
    const response = await fetch(`${API_BASE_URL}/surprises`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },
  create: async (surpriseData) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('surprises');
    }
    const response = await fetch(`${API_BASE_URL}/surprises`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(surpriseData)
    });
    return response.json();
  },
  update: async (id, surpriseData) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('surprises');
    }
    const response = await fetch(`${API_BASE_URL}/surprises/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(surpriseData)
    });
    return response.json();
  },
  delete: async (id) => {
    if (!isBackendAvailable()) {
      return getFallbackResponse('delete');
    }
    const response = await fetch(`${API_BASE_URL}/surprises/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }
};