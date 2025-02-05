import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser, loginUser, getUser } from '../lib/apiControllers'; // Update path to match your structure
import { GoogleLogin } from '../components/GoogleSignIn';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import axios from 'axios';

GoogleSignin.configure({
  webClientId: '140537177807-1tkrju2cp5dqmpkg7mhfkbhc4pntbka5.apps.googleusercontent.com',
  scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  offlineAccess: true,
  forceCodeForRefreshToken: false,
  iosClientId: '140537177807-vc2dto6ikkvj69rvkpv1t3a47oijhn7o.apps.googleusercontent.com'
});

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

  useEffect(() => {
    if (token) {
      loadUserFromStorage();
    }
  }, [token]);

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

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      console.log("User Infooooooooooooo: ", response.data.user)

      const user = response.data.user;
      const { id, name, email, photo } = user;

      setIsLoading(true);

      const result = await axios.post('https://balkanflix-server.vercel.app/api/auth/google', {
          _id: id,
          username: name,
          email,
          pfp: photo,
          isVerified: true,
      });

      setIsLoading(false)
    
      if (result.status === 200) {
        console.log("User authenticated and saved/updated in DB");   
        
        const { token, userGoogle } = result.data;
        // console.log("TOKENNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN", token)
        await AsyncStorage.setItem('authToken', token);
        setToken(token);
        setUser(userGoogle);
        setIsLoggedIn(true)
      }
    } catch (error) {
        if (error.code === statusCodes.IN_PROGRESS) {
          console.log("Google Sign-in already in progress");
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          console.log("Google Play Services not available");
        } else {
          console.error("Google Sign-in error:", error);
        }    
      }
  }
  
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
        handleGoogleLogin
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
