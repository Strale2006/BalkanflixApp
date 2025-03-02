import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

function useNotificationObserver() {
  useEffect(() => {
    let isMounted = true;

    function redirect(notification) {
      const url = notification.request.content.data?.url;
      if (url) {
        router.push(url);
      }
    }

    // Check for the last notification response on app startup
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (isMounted && response && response.notification) {
        redirect(response.notification);
      }
    });

    // Subscribe to new notification responses
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      redirect(response.notification);
    });

    return () => {
//      isMounted = false;
      subscription.remove();
    };
  }, []);
}

export default useNotificationObserver;
