import { useState, useEffect, useRef } from 'react';
import { Text, View, Button, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure how notifications should be handled when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: 'high',
  }),
});

// Set up background handler
Notifications.setNotificationChannelAsync('default', {
  name: 'default',
  importance: Notifications.AndroidImportance.MAX,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#FF231F7C',
});

// Handle background notifications
const backgroundNotificationHandler = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: 'high',
    }),
  });
};

Notifications.registerTaskAsync('BACKGROUND_NOTIFICATION_TASK', backgroundNotificationHandler);

// This is an example component to demonstrate push notifications
export default function NotificationDemo() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [channels, setChannels] = useState([]);
  const [notification, setNotification] = useState(undefined);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        console.log('Token in demo component:', token);
      }
    });

    // Set up notification channel for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      }).then(() => {
        Notifications.getNotificationChannelsAsync().then(value => {
          setChannels(value || []);
          console.log('Android notification channels:', value);
        });
      });
    }

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Received notification:', notification);
      setNotification(notification);
    });

    // Listen for notification interactions
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User interacted with notification:', response);
      const url = response.notification.request.content.data?.url;
      if (url) {
        // Handle navigation if needed
        console.log('Navigation URL:', url);
      }
    });

    // Set up background notification handler
    const backgroundSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Background notification response:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      Notifications.removeNotificationSubscription(backgroundSubscription);
    };
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'space-around' }}>
      <Text>Your expo push token: {expoPushToken}</Text>
      <Text>{`Channels: ${JSON.stringify(channels.map(c => c.id), null, 2)}`}</Text>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Title: {notification && notification.request.content.title}</Text>
        <Text>Body: {notification && notification.request.content.body}</Text>
        <Text>
          Data:{' '}
          {notification &&
            JSON.stringify(notification.request.content.data)}
        </Text>
      </View>
      <View style={{ gap: 10 }}>
        <Button
          title="Test Local Notification"
          onPress={async () => {
            const success = await testPushNotification();
            console.log('Local notification test:', success ? 'succeeded' : 'failed');
          }}
        />
        <Button
          title="Schedule Custom Notification"
          onPress={async () => {
            await schedulePushNotification(
              "Test Notification",
              "This is a test notification",
              { url: '/home' }
            );
          }}
        />
      </View>
    </View>
  );
}

export async function sendTokenToBackend(token, userId = null) {
  if (!token) return null;
  if (!userId) {
    console.error('No user ID provided for token registration');
    return null;
  }

  try {
    const deviceInfo = Platform.OS;
    console.log('Sending token to backend with userId:', userId);
    
    const payload = {
      token,
      deviceInfo,
      userId
    };
    
    console.log('Sending payload to backend:', payload);
    
    const response = await fetch('https://balkanflix-server.up.railway.app/api/push-tokens/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send token to backend:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('Push token successfully sent to backend with response:', data);
    
    // Verify the response contains the user ID
    if (!data.pushToken?.user) {
      console.error('Backend response missing user ID');
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error sending token to backend:', error);
    return null;
  }
}

export async function registerForPushNotificationsAsync(userId = null) {
  try {
    // Check if it's a physical device (notifications won't work in simulator)
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    // Check if we have permission already
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If we don't have permission, ask for it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If we still don't have permission, exit
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get the project ID from app.json
    const projectId = '9ba83abf-086c-461b-8613-9957ac12cb7b'; // Hardcoded from app.json
    console.log('Using project ID:', projectId);

    // Get the push token
    try {
      console.log('Requesting push token with project ID:', projectId);
      
      // Try to get the token with different methods
      let tokenData;
      try {
        // First try with the recommended method
        tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
      } catch (error) {
        console.log('Error with first token method, trying fallback:', error.message);
        // Fallback to the older method
        tokenData = await Notifications.getExpoPushTokenAsync();
      }
      
      const token = tokenData.data;
      
      // Verify token format
      if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
        console.error('Invalid token format. Got:', token);
        console.error('Token must start with ExponentPushToken[ or ExpoPushToken[');
        return null;
      }

      console.log('Successfully generated push token:', token);
      console.log('Token type:', tokenData.type);
      
      // Store the token in AsyncStorage
      await AsyncStorage.setItem('pushToken', token);
      console.log('Token stored in AsyncStorage');
      
      // Only proceed with backend registration if we have a userId
      if (userId) {
        console.log('Registering token with userId:', userId);
        const backendResponse = await sendTokenToBackend(token, userId);
        
        if (!backendResponse) {
          console.error('Failed to register token with backend');
          return null;
        }
        
        // Verify the backend response has the correct user ID
        if (backendResponse.pushToken?.user !== userId) {
          console.error('Backend response user ID mismatch:', backendResponse.pushToken?.user, 'expected:', userId);
          return null;
        }
        
        console.log('Token successfully registered with user:', userId);
      }
      
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      if (error.code) {
        console.error('Error code:', error.code);
      }
      if (error.message) {
        console.error('Error message:', error.message);
      }
      return null;
    }
  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
    return null;
  }
}

// Helper function to schedule a local notification (for testing)
export async function schedulePushNotification(title, body, data = {}) {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: title || "Default notification",
        body: body || "Something happened!",
        data: data,
      },
      trigger: {
        seconds: 1,
      },
    });
    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

// Add test function to verify notification setup
export async function testPushNotification() {
  try {
    // Get the stored token
    const token = await AsyncStorage.getItem('pushToken');
    if (!token) {
      console.error('No push token found in storage');
      return false;
    }

    console.log('Testing notification with token:', token);

    // Try to schedule a local notification
    const localNotifId = await schedulePushNotification(
      "Local Test Notification",
      "This is a local test - if you see this, local notifications work!",
      { test: true }
    );

    console.log('Local notification scheduled with ID:', localNotifId);
    
    return true;
  } catch (error) {
    console.error('Error testing push notification:', error);
    return false;
  }
}
