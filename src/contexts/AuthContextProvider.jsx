import { useState, useEffect } from 'react';
import { authService } from '../services/api';
import { AuthContext } from './AuthContext.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const initializeAuth = async () => {
      // Authentication bypass - automatically set mock user
      // Enable bypass in both development and production for demo purposes
      if (import.meta.env.DEV || localStorage.getItem('bypass_auth') === 'true' || import.meta.env.PROD) {
        setUser({
          _id: '68a267a5a9bca31a4430cb29',
          username: 'testuser',
          email: 'test@example.com',
          profile: {
            name: 'Test User',
            dateOfBirth: new Date('1990-01-01'),
            relationshipStart: new Date('2020-01-01')
          }
        });
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Try to get user profile
          const data = await authService.getProfile();
          if (data && data.user) {
            setUser(data.user);
          } else {
            // If profile fetch fails, try to refresh token
            try {
              const refreshData = await authService.refreshToken();
              if (refreshData && refreshData.token) {
                localStorage.setItem('token', refreshData.token);
                // Try to get profile again with new token
                const profileData = await authService.getProfile();
                if (profileData && profileData.user) {
                  setUser(profileData.user);
                } else {
                  // If still fails, clear token and redirect to login
                  localStorage.removeItem('token');
                }
              } else {
                // Refresh failed, clear token
                localStorage.removeItem('token');
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
              localStorage.removeItem('token');
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setError('');
      setLoading(true);
      const data = await authService.login(credentials);
      
      if (data.success && data.token && data.user) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.message || 'Login failed');
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error occurred');
      return { success: false, message: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      setLoading(true);
      const data = await authService.register(userData);
      
      if (data.success && data.token && data.user) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.message || 'Registration failed');
        return { success: false, message: data.message || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error occurred');
      return { success: false, message: 'Network error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const checkTokenValidity = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }

      const data = await authService.getProfile();
      if (data && data.user) {
        return true;
      } else {
        // Token is invalid, try to refresh
        try {
          const refreshData = await authService.refreshToken();
          if (refreshData && refreshData.token) {
            localStorage.setItem('token', refreshData.token);
            return true;
          } else {
            localStorage.removeItem('token');
            return false;
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('token');
          return false;
        }
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    checkTokenValidity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};