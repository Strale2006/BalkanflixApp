import apiClient from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const registerUser = async (username, email, password) => {
    try {
      // Step 1: Register the user
      const registrationResponse = await apiClient.post('/auth/register', {
        username,
        email,
        password,
      });
  
      if (!registrationResponse.data.success) {
        throw new Error('Registration failed');
      }
  
      // Step 2: Automatically log the user in
      const loginResponse = await apiClient.post('/auth/login', {
        email,
        password,
      });
  
      const { token, user } = loginResponse.data;
  
      // Step 3: Save the token locally
      await AsyncStorage.setItem('authToken', token);
  
      return { user, token }; // Return user data and token for further use
    } catch (error) {
      console.error('Error in registerUser:', error);
      throw error.response?.data || error.message;
    }
};

export const loginUser = async (email, password) => {
    try {
        const response = await apiClient.post('/auth/login', {
            email,
            password,
        });

        const { token, user } = response.data;

        // Save the token locally
        await AsyncStorage.setItem('authToken', token);

        return { user, token };
    } catch (error) {
        console.error('Error in loginUser:', error);
        throw error.response?.data || error.message;
    }
};

export const logoutUser = async () => {
    try {
        // Step 1: Remove the auth token from AsyncStorage
        await AsyncStorage.removeItem('authToken');

        // Step 2: Clear user data in context (handled in GlobalProvider)
    } catch (error) {
        console.error('Error in logoutUser:', error);
        throw error.message;
    }
};

export const getUser = async (token) => {
  try {
    const response = await apiClient.get("/private", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
  } catch (error) {
    console.error('Error fetching current user:', error.message || error);
    throw error;
  }
};

export const searchSeries = async (query, page = 1) => {
  try {
    const response = await apiClient.get("/content/searchQuery", {
      params: {
        query,
        page,
        limit: 10 // Adjust based on your needs
      }
    });

    return {
      results: response.data.data.results,
      totalPages: response.data.data.totalPages,
      currentPage: response.data.data.currentPage
    };
  } catch (error) {
    console.error('Search Error:', error);
    throw new Error(error.response?.data?.error || 'Search failed');
  }
};
