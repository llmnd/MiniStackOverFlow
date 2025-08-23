import { useState, useEffect } from 'react';

interface UserActivity {
  questionsCount: number;
  answersCount: number;
  votesReceived: number;
  votesGiven: number;
  bestAnswers: number;
  reputation: number;
  lastSeenAt: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  activity?: UserActivity;
  createdAt: string;
  roles: ('user' | 'admin')[];
  preferences: {
    emailNotifications: boolean;
    darkMode: boolean;
    language: 'en' | 'fr';
  };
}

export interface AuthError {
  code: 'SESSION_EXPIRED' | 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'SERVER_ERROR';
  message: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: AuthError | null;
  lastActivity: string | null;
}

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
  const lastActivity = localStorage.getItem('last_activity');
    
    // Check if session is expired
    if (lastActivity && Date.now() - Number(lastActivity) > SESSION_DURATION) {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('last_activity');
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        lastActivity: null
      };
    }
    
    const user = userStr ? JSON.parse(userStr) : null;
    
    return {
      user,
      token,
      isAuthenticated: !!token && !!user,
      loading: false,
      error: null,
      lastActivity
    };
  });

  const handleAuthError = (error: unknown): AuthError => {
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return { code: 'SESSION_EXPIRED', message: 'Your session has expired. Please login again.' };
      }
      if (error.message.includes('403')) {
        return { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
      }
      if (error.message.includes('Network')) {
        return { code: 'NETWORK_ERROR', message: 'Unable to connect to server. Please check your internet connection.' };
      }
    }
    return { code: 'SERVER_ERROR', message: 'An unexpected error occurred. Please try again later.' };
  };

  const login = async (token: string, user: User) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Validate token format
      if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
        throw new Error('Invalid token format');
      }

      // Store authentication data
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem('last_activity', Date.now().toString());
      
      // Fetch user's activity data
      const response = await fetch(`http://localhost:3000/api/users/${user.id}/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error(`${response.status}: ${await response.text()}`);
      
      const activity = await response.json();
      const updatedUser = { ...user, activity };
      
      setAuthState({
        user: updatedUser,
        token,
        isAuthenticated: true,
        loading: false,
        error: null,
        lastActivity: Date.now().toString()
      });

      // Set up user preferences
      if (updatedUser.preferences.darkMode) {
        document.documentElement.classList.add('dark');
      }
    } catch (error) {
      const authError = handleAuthError(error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: authError,
        lastActivity: prev.lastActivity
      }));
    }
  };

  const logout = async () => {
    try {
      if (authState.token) {
        // Notify the server about logout
        await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authState.token}`
          }
        }).catch(console.error); // Non-blocking
      }

      // Remove theme preference
      if (authState.user?.preferences.darkMode) {
        document.documentElement.classList.remove('dark');
      }

      // Clear all stored data
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('last_activity');
      
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        lastActivity: null
      });
    } catch (error) {
      const authError = handleAuthError(error);
      console.error('Logout error:', authError);
      // Force logout anyway
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: authError,
        lastActivity: null
      });
    }
  };

  // Refresh user activity periodically
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.user?.id) return;

    const fetchActivity = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/users/${authState.user!.id}/activity`, {
          headers: {
            'Authorization': `Bearer ${authState.token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user activity');
        
        const activity = await response.json();
        setAuthState(prev => ({
          ...prev,
          user: { ...prev.user!, activity }
        }));
      } catch (error) {
        console.error('Error refreshing user activity:', error);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.user?.id, authState.token]);

  return {
    ...authState,
    login,
    logout
  };
};
