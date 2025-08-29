import { Item, Reminder, NotificationPreferences } from '../types';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  actions?: NotificationAction[];
  data?: any;
}

export interface ScheduledNotification {
  id: string;
  scheduledTime: Date;
  notification: NotificationOptions;
  item?: Item;
  reminder?: Reminder;
  data?: any;
}

export interface GeofenceOptions {
  latitude: number;
  longitude: number;
  radius: number;
  identifier: string;
  notifyOnEntry?: boolean;
  notifyOnExit?: boolean;
}

export class NotificationService {
  private static registrationPromise: Promise<ServiceWorkerRegistration> | null = null;
  private static scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private static watchPosition: number | null = null;
  private static geofences: Map<string, GeofenceOptions> = new Map();

  // Check if notifications are supported
  static isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Get current permission status
  static getPermissionStatus(): NotificationPermission {
    return this.isSupported() ? Notification.permission : 'denied';
  }

  // Request notification permission
  static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Register service worker for background notifications
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      return null;
    }

    if (this.registrationPromise) {
      return this.registrationPromise;
    }

    try {
      this.registrationPromise = navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      const registration = await this.registrationPromise;
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.registrationPromise = null;
      return null;
    }
  }

  // Show immediate notification
  static async showNotification(options: NotificationOptions): Promise<boolean> {
    if (this.getPermissionStatus() !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    try {
      const registration = await this.registerServiceWorker();
      
      if (registration) {
        // Use service worker for persistent notifications
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/logo.png',
          badge: options.badge || '/logo.png',
          tag: options.tag,
          requireInteraction: options.requireInteraction || false,
          silent: options.silent || false,
          data: options.data
        });
      } else {
        // Fallback to basic notification
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/logo.png'
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // Schedule a notification
  static scheduleNotification(
    id: string,
    scheduledTime: Date,
    options: NotificationOptions,
    item?: Item,
    reminder?: Reminder
  ): void {
    // Cancel existing notification with same ID
    this.cancelScheduledNotification(id);

    const scheduled: ScheduledNotification = {
      id,
      scheduledTime,
      notification: options,
      item,
      reminder
    };

    // Calculate delay
    const delay = scheduledTime.getTime() - Date.now();
    
    if (delay <= 0) {
      // Show immediately if time has passed
      this.showNotification(options);
      return;
    }

    // Schedule the notification
    const timeoutId = setTimeout(() => {
      this.showNotification(options);
      this.scheduledNotifications.delete(id);
    }, delay);

    // Store with timeout ID for cancellation
    scheduled.data = { timeoutId };
    this.scheduledNotifications.set(id, scheduled);

    console.log(`Scheduled notification "${id}" for ${scheduledTime.toLocaleString()}`);
  }

  // Cancel a scheduled notification
  static cancelScheduledNotification(id: string): boolean {
    const scheduled = this.scheduledNotifications.get(id);
    if (scheduled?.data?.timeoutId) {
      clearTimeout(scheduled.data.timeoutId);
      this.scheduledNotifications.delete(id);
      console.log(`Cancelled scheduled notification "${id}"`);
      return true;
    }
    return false;
  }

  // Get all scheduled notifications
  static getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  // Clear all scheduled notifications
  static clearAllScheduled(): void {
    for (const [id] of this.scheduledNotifications) {
      this.cancelScheduledNotification(id);
    }
  }

  // Schedule reminders for an item
  static scheduleItemReminders(item: Item, reminders: Reminder[]): void {
    reminders.forEach(reminder => {
      const notificationTime = this.calculateNotificationTime(item, reminder);
      if (!notificationTime) return;

      const notificationId = `item-${item.id}-reminder-${reminder.id}`;
      
      const options: NotificationOptions = {
        title: 'Taskonix Reminder',
        body: reminder.message || this.generateReminderMessage(item, reminder),
        icon: '/logo.png',
        badge: '/logo.png',
        tag: notificationId,
        requireInteraction: reminder.trigger_type === 'geofence' ? false : true,
        actions: [
          {
            action: 'complete',
            title: 'Mark Done',
            icon: '/icons/check.png'
          },
          {
            action: 'snooze',
            title: 'Snooze 10m',
            icon: '/icons/snooze.png'
          }
        ],
        data: {
          itemId: item.id,
          reminderId: reminder.id,
          type: 'item_reminder'
        }
      };

      this.scheduleNotification(notificationId, notificationTime, options, item, reminder);
    });
  }

  // Calculate when to show notification based on reminder settings
  private static calculateNotificationTime(item: Item, reminder: Reminder): Date | null {
    switch (reminder.trigger_type) {
      case 'datetime':
        return reminder.trigger_at ? new Date(reminder.trigger_at) : null;
        
      case 'offset':
        if (reminder.offset_minutes && item.start_at) {
          const startTime = new Date(item.start_at);
          startTime.setMinutes(startTime.getMinutes() - reminder.offset_minutes);
          return startTime;
        }
        if (reminder.offset_minutes && item.due_at) {
          const dueTime = new Date(item.due_at);
          dueTime.setMinutes(dueTime.getMinutes() - reminder.offset_minutes);
          return dueTime;
        }
        return null;
        
      case 'geofence':
        // Geofence notifications are handled separately
        return null;
        
      default:
        return null;
    }
  }

  // Generate a default reminder message
  private static generateReminderMessage(item: Item, reminder: Reminder): string {
    switch (reminder.trigger_type) {
      case 'offset':
        if (item.type === 'event') {
          const minutes = reminder.offset_minutes || 15;
          return `${item.title} starts in ${minutes} minutes`;
        } else {
          return `Task "${item.title}" is due soon`;
        }
        
      case 'geofence':
        return item.location_name 
          ? `You've arrived at ${item.location_name}: ${item.title}`
          : `Location reminder: ${item.title}`;
          
      case 'datetime':
        return `Reminder: ${item.title}`;
        
      default:
        return item.title;
    }
  }

  // Setup geofencing (web-based simulation)
  static async setupGeofencing(): Promise<boolean> {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return false;
    }

    try {
      // Request location permission
      await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // Start watching position
      this.watchPosition = navigator.geolocation.watchPosition(
        (position) => {
          this.checkGeofences(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation watch error:', error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000, // 30 seconds
          timeout: 10000 // 10 seconds
        }
      );

      console.log('Geofencing setup successful');
      return true;
    } catch (error) {
      console.error('Failed to setup geofencing:', error);
      return false;
    }
  }

  // Stop geofencing
  static stopGeofencing(): void {
    if (this.watchPosition !== null) {
      navigator.geolocation.clearWatch(this.watchPosition);
      this.watchPosition = null;
      console.log('Geofencing stopped');
    }
  }

  // Add a geofence
  static addGeofence(options: GeofenceOptions): void {
    this.geofences.set(options.identifier, options);
    console.log(`Added geofence: ${options.identifier}`);
  }

  // Remove a geofence
  static removeGeofence(identifier: string): boolean {
    const removed = this.geofences.delete(identifier);
    if (removed) {
      console.log(`Removed geofence: ${identifier}`);
    }
    return removed;
  }

  // Check if current position triggers any geofences
  private static checkGeofences(latitude: number, longitude: number): void {
    for (const [identifier, geofence] of this.geofences) {
      const distance = this.calculateDistance(
        latitude, longitude,
        geofence.latitude, geofence.longitude
      );

      const isInside = distance <= geofence.radius;
      const wasInside = this.getGeofenceState(identifier);

      if (isInside && !wasInside && geofence.notifyOnEntry !== false) {
        // Entering geofence
        this.triggerGeofenceNotification(identifier, 'enter');
        this.setGeofenceState(identifier, true);
      } else if (!isInside && wasInside && geofence.notifyOnExit) {
        // Exiting geofence
        this.triggerGeofenceNotification(identifier, 'exit');
        this.setGeofenceState(identifier, false);
      }
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  private static calculateDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get geofence state from localStorage
  private static getGeofenceState(identifier: string): boolean {
    const state = localStorage.getItem(`geofence_state_${identifier}`);
    return state === 'true';
  }

  // Set geofence state in localStorage
  private static setGeofenceState(identifier: string, inside: boolean): void {
    localStorage.setItem(`geofence_state_${identifier}`, inside.toString());
  }

  // Trigger geofence notification
  private static triggerGeofenceNotification(identifier: string, action: 'enter' | 'exit'): void {
    // Find associated item/reminder
    const scheduledNotification = this.scheduledNotifications.get(identifier);
    
    if (scheduledNotification) {
      const { item, reminder } = scheduledNotification;
      const actionText = action === 'enter' ? 'arrived at' : 'left';
      
      const options: NotificationOptions = {
        title: 'Location Reminder',
        body: item && item.location_name 
          ? `You've ${actionText} ${item.location_name}: ${item.title}`
          : `Location reminder: ${item?.title || 'Task'}`,
        icon: '/logo.png',
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View Task',
            icon: '/icons/view.png'
          }
        ],
        data: {
          itemId: item?.id,
          reminderId: reminder?.id,
          type: 'geofence',
          action
        }
      };

      this.showNotification(options);
    }
  }

  // Handle notification clicks and actions
  static handleNotificationAction(event: NotificationEvent, action?: string): void {
    const data = event.notification.data;
    
    if (!data) return;

    switch (action) {
      case 'complete':
        // Mark item as complete
        if (data.itemId) {
          // This would integrate with your store to update the item
          console.log('Mark item complete:', data.itemId);
        }
        break;
        
      case 'snooze':
        // Snooze for 10 minutes
        const snoozeTime = new Date(Date.now() + 10 * 60 * 1000);
        const options = {
          title: event.notification.title,
          body: event.notification.body,
          icon: event.notification.icon,
          data: data
        };
        this.scheduleNotification(`snooze_${Date.now()}`, snoozeTime, options);
        break;
        
      case 'view':
        // Open app to view item
        if (data.itemId) {
          // This would navigate to the item in your app
          const url = `/items/${data.itemId}`;
          // In a service worker context, you'd use clients.openWindow(url)
          console.log('Navigate to item:', url);
        }
        break;
    }

    event.notification.close();
  }

  // Get default notification preferences
  static getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      sound: true,
      vibrate: true,
      default_lead_time: 15,
      location_reminders: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00'
    };
  }

  // Check if we're in quiet hours
  static isQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);
    
    const startTime = startHour * 100 + startMin;
    const endTime = endHour * 100 + endMin;

    if (startTime <= endTime) {
      // Same day (e.g., 9:00 to 17:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Crosses midnight (e.g., 22:00 to 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Test notification (for settings/debugging)
  static async testNotification(): Promise<boolean> {
    return this.showNotification({
      title: 'Test Notification',
      body: 'Taskonix notifications are working correctly!',
      icon: '/logo.png',
      tag: 'test',
      requireInteraction: false
    });
  }
}