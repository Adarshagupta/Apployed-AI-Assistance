import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/apiService';
const { authAPI, getToken, removeToken } = apiService;

// Create context
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);

        // Check if token exists
        const token = getToken();
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        try {
          // Try to get user profile from API
          const userProfile = await authAPI.getProfile();
          setUser(userProfile);
        } catch (apiError) {
          console.error('API Error loading user profile:', apiError);
          // For now, just use the stored user data to avoid blocking the UI
          const storedUser = localStorage.getItem('apployd_user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (parseError) {
              console.error('Error parsing stored user:', parseError);
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error in loadUser function:', error);
        setError(error.message);
        // If token is invalid, remove it
        removeToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Logout function
  const logout = () => {
    removeToken();
    localStorage.removeItem('apployd_user');
    setUser(null);
  };

  // Update user function
  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('apployd_user', JSON.stringify(userData));
  };

  return (
    <UserContext.Provider value={{ user, isLoading, error, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext;
