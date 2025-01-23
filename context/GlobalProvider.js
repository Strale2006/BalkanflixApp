import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser, loginUser, getUser } from '../lib/appwrite'; // Update path to match your structure

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserFromStorage = async () => {
    setIsLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
        const currentUser = await getUser(storedToken);
        setUser(currentUser);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      setIsLoggedIn(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      setUser(null);
      setToken(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      const { token, user } = await registerUser(username, email, password);
      await AsyncStorage.setItem('authToken', token);
      setToken(token);
      setUser(user);
      setIsLoggedIn(true);
    } catch (error) {
      throw error;
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const { token, user } = await loginUser(email, password);
      await AsyncStorage.setItem('authToken', token);
      setToken(token);
      setUser(user);
      setIsLoggedIn(true);
    } catch (error) {
      throw error;
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        user,
        setUser,
        token,
        setToken,
        isLoading,
        handleRegister,
        handleLogin,
        logout,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
