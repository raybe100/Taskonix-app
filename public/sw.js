// Taskonix Service Worker
// Handles background notifications and caching

const CACHE_NAME = 'taskonix-v1';
const urlsToCache = [
  '/',
  '/logo.png',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'sync-reminders') {
    event.waitUntil(syncReminders());
  }
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Taskonix', body: event.data.text() || 'New notification' };
    }
  }

  const options = {
    body: data.body || 'You have a new reminder',
    icon: '/logo.png',
    badge: '/logo.png',
    tag: data.tag || 'reminder',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss.png'
      }
    ],
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Taskonix Reminder', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  event.notification.close();

  if (action === 'dismiss') {
    // Just close the notification
    return;
  }

  if (action === 'view' || !action) {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Focus existing window if available
          for (const client of clientList) {
            if (client.url.includes('taskonix') && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window
          if (clients.openWindow) {
            const url = data.itemId ? `/?item=${data.itemId}` : '/';
            return clients.openWindow(url);
          }
        })
    );
  } else if (action === 'complete') {
    // Mark item as complete
    event.waitUntil(completeItem(data.itemId));
  } else if (action === 'snooze') {
    // Snooze notification
    event.waitUntil(snoozeNotification(data));
  }
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
  
  // Track dismissals for analytics if needed
  const data = event.notification.data || {};
  if (data.trackDismissal) {
    // Could send analytics event here
  }
});

// Helper function to sync reminders
async function syncReminders() {
  try {
    console.log('Syncing reminders in background...');
    
    // This would typically fetch pending reminders from your API
    // and schedule them locally
    
    // For now, just log that sync completed
    console.log('Reminder sync completed');
  } catch (error) {
    console.error('Failed to sync reminders:', error);
  }
}

// Helper function to complete an item
async function completeItem(itemId) {
  if (!itemId) return;
  
  try {
    console.log('Completing item:', itemId);
    
    // This would typically make an API call to mark the item as complete
    // For now, store it locally and sync when online
    
    const completedItems = await getStoredData('completed_items') || [];
    completedItems.push({
      itemId,
      completedAt: new Date().toISOString(),
      completedVia: 'notification'
    });
    
    await storeData('completed_items', completedItems);
    
    // Show confirmation notification
    await self.registration.showNotification('Task Completed', {
      body: 'Task marked as complete',
      icon: '/logo.png',
      tag: 'completion',
      requireInteraction: false
    });
    
    console.log('Item marked as complete:', itemId);
  } catch (error) {
    console.error('Failed to complete item:', error);
  }
}

// Helper function to snooze a notification
async function snoozeNotification(data) {
  try {
    console.log('Snoozing notification:', data);
    
    // Schedule new notification in 10 minutes
    const snoozeTime = Date.now() + (10 * 60 * 1000); // 10 minutes
    
    // Store snooze info
    const snoozedNotifications = await getStoredData('snoozed_notifications') || [];
    snoozedNotifications.push({
      originalData: data,
      snoozeTime,
      snoozedAt: new Date().toISOString()
    });
    
    await storeData('snoozed_notifications', snoozedNotifications);
    
    // Show confirmation
    await self.registration.showNotification('Reminder Snoozed', {
      body: 'You will be reminded again in 10 minutes',
      icon: '/logo.png',
      tag: 'snooze-confirmation',
      requireInteraction: false
    });
    
    console.log('Notification snoozed for 10 minutes');
  } catch (error) {
    console.error('Failed to snooze notification:', error);
  }
}

// Helper function to get stored data
async function getStoredData(key) {
  try {
    const cache = await caches.open('taskonix-data');
    const response = await cache.match(`/data/${key}`);
    
    if (response) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get stored data:', error);
    return null;
  }
}

// Helper function to store data
async function storeData(key, data) {
  try {
    const cache = await caches.open('taskonix-data');
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`/data/${key}`, response);
  } catch (error) {
    console.error('Failed to store data:', error);
  }
}

// Periodic background sync for checking reminders
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-reminders') {
    event.waitUntil(checkPendingReminders());
  }
});

// Check for pending reminders
async function checkPendingReminders() {
  try {
    console.log('Checking pending reminders...');
    
    const snoozedNotifications = await getStoredData('snoozed_notifications') || [];
    const now = Date.now();
    
    // Check for snoozed notifications that should fire now
    const dueNotifications = snoozedNotifications.filter(
      (item) => item.snoozeTime <= now
    );
    
    for (const notification of dueNotifications) {
      const { originalData } = notification;
      
      await self.registration.showNotification(
        originalData.title || 'Taskonix Reminder',
        {
          body: originalData.body || 'Snoozed reminder',
          icon: '/logo.png',
          tag: originalData.tag || 'reminder',
          requireInteraction: true,
          data: originalData.data
        }
      );
    }
    
    // Remove fired notifications
    if (dueNotifications.length > 0) {
      const remainingNotifications = snoozedNotifications.filter(
        (item) => item.snoozeTime > now
      );
      await storeData('snoozed_notifications', remainingNotifications);
    }
    
    console.log('Reminder check completed');
  } catch (error) {
    console.error('Failed to check pending reminders:', error);
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SCHEDULE_REMINDER':
      // Handle scheduling a reminder
      handleScheduleReminder(data);
      break;
      
    case 'CANCEL_REMINDER':
      // Handle canceling a reminder
      handleCancelReminder(data);
      break;
      
    case 'SYNC_DATA':
      // Handle data sync request
      handleSyncData(data);
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Handle schedule reminder message
async function handleScheduleReminder(data) {
  try {
    const { id, scheduledTime, notification } = data;
    
    // Store the reminder
    const reminders = await getStoredData('scheduled_reminders') || {};
    reminders[id] = {
      id,
      scheduledTime,
      notification,
      createdAt: new Date().toISOString()
    };
    
    await storeData('scheduled_reminders', reminders);
    console.log('Reminder scheduled:', id);
  } catch (error) {
    console.error('Failed to schedule reminder:', error);
  }
}

// Handle cancel reminder message
async function handleCancelReminder(data) {
  try {
    const { id } = data;
    
    const reminders = await getStoredData('scheduled_reminders') || {};
    delete reminders[id];
    
    await storeData('scheduled_reminders', reminders);
    console.log('Reminder cancelled:', id);
  } catch (error) {
    console.error('Failed to cancel reminder:', error);
  }
}

// Handle sync data message
async function handleSyncData(data) {
  try {
    console.log('Syncing data with server...');
    
    // This would implement your data sync logic
    // For example, uploading completed items, downloading new reminders, etc.
    
    console.log('Data sync completed');
  } catch (error) {
    console.error('Failed to sync data:', error);
  }
}