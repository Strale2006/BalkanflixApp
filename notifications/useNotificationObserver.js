import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

function useNotificationObserver() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Configure notification behavior for Android
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      }).catch(error => {
        console.error('Error setting notification channel:', error);
      });
    }

    // Handle notification when app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      try {
        const { title, body, data } = notification.request.content;
        console.log('Received notification:', { title, body, data });
      } catch (error) {
        console.error('Error handling received notification:', error);
      }
    });

    // Handle user interaction with notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      try {
        const { data } = response.notification.request.content;
        
        // Handle navigation if URL is provided
        if (data?.url) {
          router.push(data.url);
        }

        // Handle other custom actions
        if (data?.action) {
          handleNotificationAction(data.action, data);
        }
      } catch (error) {
        console.error('Error handling notification response:', error);
      }
    });

    // Check for initial notification that launched the app
    Notifications.getLastNotificationResponseAsync()
      .then(response => {
        if (response) {
          const { data } = response.notification.request.content;
          if (data?.url) {
            router.push(data.url);
          }
        }
      })
      .catch(error => {
        console.error('Error checking initial notification:', error);
      });

    // Cleanup
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);
}

// Handle different types of notification actions
function handleNotificationAction(action, data) {
  switch (action) {
    case 'openProfile':
      router.push('/profileModal');
      break;
    case 'openMovie':
      if (data.movieId) {
        router.push(`/details/${data.movieId}`);
      }
      break;
    case 'openEpisode':
      if (data.title && data.ep) {
        router.push(`/${data.title}/${data.ep}`);
      }
      break;
    default:
      console.log('Unknown notification action:', action);
  }
}

export default useNotificationObserver;