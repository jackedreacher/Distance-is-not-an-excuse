import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

// Custom hook for using auth context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { useAuth };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const initializeAuth = async () => {
      // Development bypass - automatically set mock user
      if (import.meta.env.DEV || localStorage.getItem('bypass_auth') === 'true') {
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
                setUser(refreshData.user);
              } else {
                // If refresh fails, remove token
                localStorage.removeItem('token');
                setUser(null);
              }
            } catch (refreshErr) {
              console.error('Token refresh error:', refreshErr);
              localStorage.removeItem('token');
              setUser(null);
            }
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          // Try to refresh token
          try {
            const refreshData = await authService.refreshToken();
            if (refreshData && refreshData.token) {
              localStorage.setItem('token', refreshData.token);
              setUser(refreshData.user);
            } else {
              // If refresh fails, remove token
              localStorage.removeItem('token');
              setUser(null);
            }
          } catch (refreshErr) {
            console.error('Token refresh error:', refreshErr);
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const data = await authService.login(credentials);
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.message || 'Giriş başarısız');
        return { success: false, message: data.message };
      }
    } catch (err) {
      setError('Giriş sırasında bir hata oluştu');
      console.error('Login error:', err);
      return { success: false, message: 'Giriş sırasında bir hata oluştu' };
    }
  };

  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return { success: true };
      } else {
        setError(data.message || 'Kayıt başarısız');
        return { success: false, message: data.message };
      }
    } catch (err) {
      setError('Kayıt sırasında bir hata oluştu');
      console.error('Registration error:', err);
      return { success: false, message: 'Kayıt sırasında bir hata oluştu' };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const checkTokenValidity = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Try to get user profile to check if token is still valid
        const data = await authService.getProfile();
        if (data && data.user) {
          setUser(data.user);
          return true;
        } else {
          // If profile fetch fails, try to refresh token
          try {
            const refreshData = await authService.refreshToken();
            if (refreshData && refreshData.token) {
              localStorage.setItem('token', refreshData.token);
              setUser(refreshData.user);
              return true;
            }
          } catch (refreshErr) {
            console.error('Token refresh error:', refreshErr);
          }
          // If refresh fails, remove token
          localStorage.removeItem('token');
          setUser(null);
          return false;
        }
      } catch (err) {
        console.error('Token validation error:', err);
        // Try to refresh token
        try {
          const refreshData = await authService.refreshToken();
          if (refreshData && refreshData.token) {
            localStorage.setItem('token', refreshData.token);
            setUser(refreshData.user);
            return true;
          }
        } catch (refreshErr) {
          console.error('Token refresh error:', refreshErr);
        }
        // If refresh fails, remove token
        localStorage.removeItem('token');
        setUser(null);
        return false;
      }
    }
    return false;
  };

  const value = {
    user,
    login,
    register,
    logout,
    error,
    setError,
    checkTokenValidity
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};