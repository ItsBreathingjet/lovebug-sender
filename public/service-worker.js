
self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: '/lovebug-icon.png',
    badge: '/lovebug-badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('LoveBug Message! 💝', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
