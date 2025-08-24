import { Task } from '../types';

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

/**
 * Show a task reminder notification
 */
export function showTaskNotification(task: Task, minutesBefore: number = 0): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const title = minutesBefore > 0 
    ? `Reminder: ${task.title}` 
    : `Starting Now: ${task.title}`;
  
  const options: NotificationOptions = {
    body: minutesBefore > 0 
      ? `This task starts in ${minutesBefore} minutes`
      : `Time to start your task!`,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: `task-${task.id}`,
    requireInteraction: false,
    silent: false
  };

  const notification = new Notification(title, options);
  
  // Auto-close after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);

  // Handle click to focus window
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

/**
 * Schedule notifications for upcoming tasks
 */
export function scheduleTaskNotifications(tasks: Task[]): void {
  // Clear existing timeouts if any
  clearScheduledNotifications();

  const now = new Date();
  const scheduledTasks = tasks.filter(task => 
    task.start && new Date(task.start) > now
  );

  scheduledTasks.forEach(task => {
    const taskStart = new Date(task.start!);
    const timeTo = taskStart.getTime() - now.getTime();

    // Schedule notification 5 minutes before (if more than 5 minutes away)
    if (timeTo > 5 * 60 * 1000) {
      const reminderTime = timeTo - (5 * 60 * 1000);
      setTimeout(() => {
        showTaskNotification(task, 5);
      }, reminderTime);
    }

    // Schedule notification at start time
    if (timeTo > 0) {
      setTimeout(() => {
        showTaskNotification(task, 0);
      }, timeTo);
    }
  });
}

/**
 * Clear all scheduled notifications
 */
export function clearScheduledNotifications(): void {
  // Note: We can't actually clear individual timeouts without storing their IDs
  // This is a placeholder for a more robust implementation
  console.log('Clearing scheduled notifications...');
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsEnabled(): boolean {
  return 'Notification' in window && Notification.permission === 'granted';
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}