import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  pendingConfirmation: null // New state for pending email confirmation
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true
      };
    case 'LOGIN_REQUIRES_CONFIRMATION':
      return {
        ...state,
        isLoading: false,
        pendingConfirmation: action.payload
      };
    case 'LOGIN_SUCCESS':
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
      }
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        pendingConfirmation: null
      };
    case 'LOGIN_FAILURE':
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        pendingConfirmation: null
      };
    case 'CONFIRMATION_START':
      return {
        ...state,
        isLoading: true
      };
    case 'CONFIRMATION_SUCCESS':
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload.token);
      }
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        pendingConfirmation: null
      };
    case 'CONFIRMATION_FAILURE':
      return {
        ...state,
        isLoading: false
        // Keep pendingConfirmation state so user can try again
      };
    case 'LOGOUT':
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        pendingConfirmation: null
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'CLEAR_PENDING_CONFIRMATION':
      return {
        ...state,
        pendingConfirmation: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      // Safely check for localStorage
      if (typeof window === 'undefined') {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const response = await api.get('/auth/me');
        dispatch({ type: 'SET_USER', payload: response.data });
      } catch (error) {
        console.error('Auth check failed:', error);
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.requiresConfirmation) {
        dispatch({ 
          type: 'LOGIN_REQUIRES_CONFIRMATION', 
          payload: {
            userId: response.data.userId,
            email: response.data.email,
            message: response.data.message
          }
        });
        return { success: true, requiresConfirmation: true };
      } else {
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: {
            user: response.data.user,
            token: response.data.token
          }
        });
        return { success: true };
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const confirmEmail = async (confirmationCode) => {
    if (!state.pendingConfirmation) {
      return { success: false, error: 'No pending confirmation' };
    }

    dispatch({ type: 'CONFIRMATION_START' });
    
    try {
      const response = await api.post('/auth/confirm-email', {
        userId: state.pendingConfirmation.userId,
        confirmationCode: confirmationCode
      });
      
      dispatch({ 
        type: 'CONFIRMATION_SUCCESS', 
        payload: {
          user: response.data.user,
          token: response.data.token
        }
      });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'CONFIRMATION_FAILURE' });
      return { 
        success: false, 
        error: error.response?.data?.error || 'Confirmation failed' 
      };
    }
  };

  const resendConfirmation = async () => {
    if (!state.pendingConfirmation) {
      return { success: false, error: 'No pending confirmation' };
    }

    try {
      await api.post('/auth/resend-confirmation', {
        userId: state.pendingConfirmation.userId
      });
      return { success: true, message: 'Confirmation email sent successfully' };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to resend confirmation email' 
      };
    }
  };

  const cancelConfirmation = () => {
    dispatch({ type: 'CLEAR_PENDING_CONFIRMATION' });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/auth/me', profileData);
      dispatch({ type: 'SET_USER', payload: response.data.user });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Profile update failed' 
      };
    }
  };

  const value = {
    ...state,
    login,
    confirmEmail,
    resendConfirmation,
    cancelConfirmation,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 