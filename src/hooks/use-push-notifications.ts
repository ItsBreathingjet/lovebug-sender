
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<any | null>(null);
  const { toast } = useToast();
  
  // Check if running on a native platform
  const isNativePlatform = Capacitor.isNativePlatform();

  const registerServiceWorker = async () => {
    // Only needed for web
    if (!isNativePlatform && 'serviceWorker' in navigator) {
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
      if (isNativePlatform) {
        // Handle native permissions
        const result = await PushNotifications.requestPermissions();
        if (result.receive === 'granted') {
          setPermission('granted');
          // Register with FCM or APNS
          await PushNotifications.register();
          return 'granted';
        } else {
          setPermission('denied');
          return 'denied';
        }
      } else {
        // Web fallback
        const permission = await Notification.requestPermission();
        setPermission(permission);
        return permission;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  };

  const subscribeToNotifications = async () => {
    try {
      if (isNativePlatform) {
        // For native platforms, the registration is done in requestPermission
        // Just get the token
        const tokenResult = await PushNotifications.addListener('registration', 
          (token) => {
            console.log('Push registration success, token: ' + token.value);
            setSubscription(token);
            
            // Save token to our backend
            supabase.functions.invoke('send-push-notification', {
              body: { subscription: { token: token.value, platform: Capacitor.getPlatform() } }
            });
            
            return token;
          }
        );
        
        // Add other listeners
        PushNotifications.addListener('registrationError', 
          (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
          }
        );
        
        PushNotifications.addListener('pushNotificationReceived', 
          (notification) => {
            console.log('Push notification received: ' + JSON.stringify(notification));
          }
        );
        
        PushNotifications.addListener('pushNotificationActionPerformed', 
          (notification) => {
            console.log('Push notification action performed: ' + JSON.stringify(notification));
          }
        );
        
        return tokenResult;
      } else {
        // Web implementation
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
        
        // Save subscription to our backend
        await supabase.functions.invoke('send-push-notification', {
          body: { subscription: newSubscription }
        });
        
        return newSubscription;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  };

  const sendNotification = async (message: string) => {
    if (!subscription) return false;

    try {
      const response = await supabase.functions.invoke('send-push-notification', {
        body: { 
          subscription,
          message,
          platform: isNativePlatform ? Capacitor.getPlatform() : 'web'
        }
      });
      
      return response.data?.success || false;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  };

  useEffect(() => {
    if (isNativePlatform) {
      // Set up native listeners on component mount
      const setupNativeListeners = async () => {
        await PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token: ' + token.value);
          setSubscription(token);
          setPermission('granted');
        });
        
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });
        
        // Check if already registered
        try {
          const permissionStatus = await PushNotifications.checkPermissions();
          if (permissionStatus.receive === 'granted') {
            setPermission('granted');
            await PushNotifications.register();
          }
        } catch (error) {
          console.error('Error checking permissions:', error);
        }
      };
      
      setupNativeListeners();
    } else if ('Notification' in window) {
      // Web notification setup
      setPermission(Notification.permission);

      if (permission === 'granted') {
        registerServiceWorker().then(registration => {
          if (registration) {
            registration.pushManager.getSubscription().then(existingSubscription => {
              if (existingSubscription) {
                setSubscription(existingSubscription);
              }
            });
          }
        });
      }
    }
  }, [permission]);

  return {
    permission,
    subscription,
    requestPermission: requestNotificationPermission,
    subscribe: subscribeToNotifications,
    sendNotification
  };
}
