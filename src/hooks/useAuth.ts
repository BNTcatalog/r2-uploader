import { useState, useEffect } from 'react';
import { AuthState } from '../types';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    error: null
  });

  // Check if the user is already authenticated (from sessionStorage)
  useEffect(() => {
    const isAuth = sessionStorage.getItem('is_authenticated') === 'true';
    if (isAuth) {
      setAuthState({
        isAuthenticated: true,
        error: null
      });
    }
  }, []);

  const login = async (password: string) => {
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800));

      const correctPassword = import.meta.env.VITE_AUTH_PASSWORD;

      if (!correctPassword) {
        throw new Error('Authentication configuration is missing. Please set VITE_AUTH_PASSWORD in your environment.');
      }

      if (password === correctPassword) {
        sessionStorage.setItem('is_authenticated', 'true');
        setAuthState({
          isAuthenticated: true,
          error: null
        });
        return true;
      } else {
        setAuthState({
          isAuthenticated: false,
          error: 'Invalid password. Please try again.'
        });
        return false;
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Authentication failed. Please try again.'
      });
      return false;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('is_authenticated');
    setAuthState({
      isAuthenticated: false,
      error: null
    });
  };

  return {
    ...authState,
    login,
    logout
  };
};