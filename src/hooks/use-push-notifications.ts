
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const { toast } = useToast();

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  };

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  const subscribeToNotifications = async () => {
    try {
      const registration = await registerServiceWorker();
      if (!registration) return null;

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
        return existingSubscription;
      }

      const publicVapidKey = 'BLBz-qwKrCEYarzcJcerHHQUvgE-2kGtF3H_' + 
                            'UQW7hpKXuNWFKPNQnP_ICxyJqH9xJLEbqxExqZF' + 
                            'nqqUvnFQ1pY8';

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicVapidKey
      });

      setSubscription(newSubscription);
      return newSubscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  return {
    permission,
    subscription,
    requestPermission: requestNotificationPermission,
    subscribe: subscribeToNotifications
  };
}
