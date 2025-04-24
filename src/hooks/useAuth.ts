// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { AuthState } from '../types';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    error: null
  });
  const [isLoading, setIsLoading] = useState(false); // Add loading state

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

  const login = async (password: string): Promise<boolean> => {
    setIsLoading(true); // Start loading
    setAuthState(prev => ({ ...prev, error: null })); // Clear previous errors

    try {
      const response = await fetch('/api/auth', { // Call the Cloudflare Function
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem('is_authenticated', 'true');
        setAuthState({
          isAuthenticated: true,
          error: null
        });
        setIsLoading(false); // Stop loading
        return true;
      } else {
        // Handle specific errors or provide a general message
        const errorMessage = data.error || `Authentication failed (Status: ${response.status})`;
        setAuthState({
          isAuthenticated: false,
          error: errorMessage
        });
        setIsLoading(false); // Stop loading
        return false;
      }
    } catch (error) {
      console.error("Login API call error:", error);
      setAuthState({
        isAuthenticated: false,
        error: error instanceof Error ? `Network or server error: ${error.message}` : 'Authentication failed. Please try again.'
      });
      setIsLoading(false); // Stop loading
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
    isLoading, // Expose loading state
    login,
    logout
  };
};
