import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser, loginUser, getUser } from '../lib/apiControllers'; // Update path to match your structure
import { GoogleLogin } from '../components/GoogleSignIn';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import axios from 'axios';
import { registerForPushNotificationsAsync, sendTokenToBackend } from '../notifications/PushNotificationService';

GoogleSignin.configure({
  webClientId: '213162142911-3mmlgpbh3k37h29mtoi2h2f95v5m1qjf.apps.googleusercontent.com',
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
        
        // Update push token with user ID if available
        if (currentUser?._id) {
          const pushToken = await AsyncStorage.getItem('pushToken');
          if (pushToken) {
            console.log('Updating push token with user ID on app startup');
            await sendTokenToBackend(pushToken, currentUser._id);
          }
        }
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

  useEffect(() => {
    if (user) {
      // Store the latest user data whenever it changes
      const storeUserData = async () => {
        try {
          await AsyncStorage.setItem('userData', JSON.stringify(user));
        } catch (error) {
          console.error('Error storing user data:', error);
        }
      };
      storeUserData();
    }
  }, [user]);

  const logout = async () => {
    try {
      console.log('Starting logout process...'); // Debug log
      
      // Get the push token before clearing storage
      const pushToken = await AsyncStorage.getItem('pushToken');
      console.log('Push token found during logout:', pushToken); // Debug log
      
      // Remove token from backend if it exists
      if (pushToken) {
        try {
          console.log('Attempting to remove token from backend:', pushToken); // Debug log
          const response = await fetch('https://balkanflix-server.vercel.app/api/push-tokens/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: pushToken }),
          });

          if (!response.ok) {
            console.error('Failed to remove push token from backend. Status:', response.status);
            const errorText = await response.text();
            console.error('Error response:', errorText);
          } else {
            console.log('Token successfully removed from backend'); // Debug log
          }
        } catch (error) {
          console.error('Error removing push token from backend:', error);
        }
      } else {
        console.log('No push token found to remove'); // Debug log
      }

      // Clear all relevant storage
      console.log('Clearing AsyncStorage...'); // Debug log
      await Promise.all([
        AsyncStorage.removeItem('authToken'),
        AsyncStorage.removeItem('pushToken'),
        AsyncStorage.removeItem('notificationPermissionRequested'),
        AsyncStorage.removeItem('userData')
      ]);
      console.log('AsyncStorage cleared'); // Debug log

      // Reset state
      setUser(null);
      setToken(null);
      setIsLoggedIn(false);
      console.log('State reset complete'); // Debug log
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      console.log('Starting notification permission request...'); // Debug log
      const hasRequestedBefore = await AsyncStorage.getItem('notificationPermissionRequested');
      console.log('Has requested before:', hasRequestedBefore); // Debug log

      // Get the current user ID if available
      const userId = user?._id;
      console.log('Current user ID for push notification:', userId); // Debug log

      if (!hasRequestedBefore) {
        console.log('Requesting new token...'); // Debug log
        const token = await registerForPushNotificationsAsync(userId);
        console.log('Received token:', token); // Debug log

        if (token) {
          try {
            // Store both flags when we successfully get a token
            await AsyncStorage.setItem('pushToken', token);
            console.log('Push token stored in AsyncStorage'); // Debug log
            
            await AsyncStorage.setItem('notificationPermissionRequested', 'true');
            console.log('Permission flag stored in AsyncStorage'); // Debug log

            // Verify storage
            const storedToken = await AsyncStorage.getItem('pushToken');
            console.log('Verified stored token:', storedToken); // Debug log
          } catch (storageError) {
            console.error('Error storing token in AsyncStorage:', storageError);
          }
        }
      } else {
        // Check if we have a stored token even though we requested before
        const existingToken = await AsyncStorage.getItem('pushToken');
        console.log('Existing token found:', existingToken); // Debug log
        
        if (!existingToken) {
          console.log('No token found, requesting new one despite previous request'); // Debug log
          const token = await registerForPushNotificationsAsync(userId);
          if (token) {
            await AsyncStorage.setItem('pushToken', token);
            console.log('New token stored:', token); // Debug log
          }
        } else if (userId) {
          // If we have a token and a user ID, update the token with the user ID
          console.log('Updating existing token with user ID:', userId);
          await sendTokenToBackend(existingToken, userId);
        }
      }
    } catch (error) {
      console.error('Error in requestNotificationPermission:', error);
    }
  };

  const handleRegister = async (username, email, password) => {
    try {
      const { token, user } = await registerUser(username, email, password);
      await AsyncStorage.setItem('authToken', token);
      setToken(token);
      setUser(user);
      setIsLoggedIn(true);
      
      // Request notification permission and update token with user ID
      await requestNotificationPermission();
      
      // Also update any existing token with the user ID
      const existingToken = await AsyncStorage.getItem('pushToken');
      if (existingToken && user?._id) {
        console.log('Updating push token with new user ID after registration');
        await sendTokenToBackend(existingToken, user._id);
      }
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
      
      // Request notification permission and update token with user ID
      await requestNotificationPermission();
      
      // Also update any existing token with the user ID
      const existingToken = await AsyncStorage.getItem('pushToken');
      if (existingToken && user?._id) {
        console.log('Updating push token with user ID after login');
        await sendTokenToBackend(existingToken, user._id);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      // Check if we have a valid response and user data
      if (!response?.data?.user) {
        console.log('Google Sign-in was cancelled or failed');
        return;
      }

      const user = response.data.user;
      const { id, name, email, photo } = user;

      // Validate required fields
      if (!id || !name || !email) {
        console.error('Missing required user data from Google');
        return;
      }

      setIsLoading(true);

      try {
        const result = await axios.post('https://balkanflix-server.vercel.app/api/auth/google', {
          _id: id,
          username: name,
          email,
          pfp: photo,
          isVerified: true,
        });

        if (result.status === 200) {
          console.log("User authenticated and saved/updated in DB");   
          
          const { token, userGoogle } = result.data;
          await AsyncStorage.setItem('authToken', token);
          setToken(token);
          setUser(userGoogle);
          setIsLoggedIn(true);
          
          // Request notification permission and update token with user ID
          await requestNotificationPermission();
          
          // Also update any existing token with the user ID
          const existingToken = await AsyncStorage.getItem('pushToken');
          if (existingToken && userGoogle?._id) {
            console.log('Updating push token with user ID after Google login');
            await sendTokenToBackend(existingToken, userGoogle._id);
          }
        }
      } catch (error) {
        console.error('Error during Google authentication:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled the login flow");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Google Sign-in already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("Google Play Services not available");
      } else {
        console.error("Google Sign-in error:", error);
      }
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
        handleGoogleLogin
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
