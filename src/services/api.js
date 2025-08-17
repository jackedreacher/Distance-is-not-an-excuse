// API service for connecting frontend to backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Auth API calls
export const authService = {
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return response.json();
  },

  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  refreshToken: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token available');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    return response.json();
  }
};

// Mood API calls
export const moodService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/moods`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },


  create: async (moodData) => {
    const response = await fetch(`${API_BASE_URL}/moods`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(moodData)
    });
    return response.json();
  },

  update: async (id, moodData) => {
    const response = await fetch(`${API_BASE_URL}/moods/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(moodData)
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/moods/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

// Task API calls
export const taskService = {
  createTask: async (taskData) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    return response.json();
  },
  
  updateTask: async (id, taskData) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(taskData)
    });
    return response.json();
  },
  
  deleteTask: async (id) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

// Planning API calls
export const planningService = {
  createEvent: async (eventData) => {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData)
    });
    return response.json();
  },
  
  updateEvent: async (id, eventData) => {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(eventData)
    });
    return response.json();
  },
  
  deleteEvent: async (id) => {
    const response = await fetch(`${API_BASE_URL}/events/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

// Wishlist API calls
export const wishlistService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/wishlist`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  create: async (itemData) => {
    const response = await fetch(`${API_BASE_URL}/wishlist`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData)
    });
    return response.json();
  },

  update: async (id, itemData) => {
    const response = await fetch(`${API_BASE_URL}/wishlist/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData)
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/wishlist/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

// Music API calls
export const musicService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/songs`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  add: async (songData) => {
    const response = await fetch(`${API_BASE_URL}/songs`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(songData)
    });
    return response.json();
  },

  update: async (id, songData) => {
    const response = await fetch(`${API_BASE_URL}/songs/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(songData)
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/songs/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

// Surprise API calls
export const surpriseService = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/surprises`, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  create: async (surpriseData) => {
    const response = await fetch(`${API_BASE_URL}/surprises`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(surpriseData)
    });
    return response.json();
  },

  update: async (id, surpriseData) => {
    const response = await fetch(`${API_BASE_URL}/surprises/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(surpriseData)
    });
    return response.json();
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/surprises/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return response.json();
  }
};