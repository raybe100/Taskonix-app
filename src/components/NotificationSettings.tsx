import { useState, useEffect } from 'react';
import { NotificationPreferences } from '../types';
import { NotificationService } from '../services/NotificationService';
import { useItemsStore } from '../store/useItemsStore';

interface NotificationSettingsProps {
  className?: string;
}

export function NotificationSettings({ className = '' }: NotificationSettingsProps) {
  const { profile, updateProfile } = useItemsStore();
  
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => {
    return profile?.preferences?.notifications || NotificationService.getDefaultPreferences();
  });
  
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [geofencingEnabled, setGeofencingEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize component state
  useEffect(() => {
    // Check notification permission status
    setPermissionStatus(NotificationService.getPermissionStatus());
    
    // Load preferences from profile
    if (profile?.preferences?.notifications) {
      setPreferences(profile.preferences.notifications);
    }
  }, [profile]);

  // Request notification permission
  const requestPermission = async () => {
    const granted = await NotificationService.requestPermission();
    setPermissionStatus(NotificationService.getPermissionStatus());
    
    if (granted && preferences.enabled) {
      // Register service worker and setup
      await NotificationService.registerServiceWorker();
      
      if (preferences.location_reminders) {
        const geofenceSetup = await NotificationService.setupGeofencing();
        setGeofencingEnabled(geofenceSetup);
      }
    }
  };

  // Test notification
  const testNotification = async () => {
    if (permissionStatus !== 'granted') {
      await requestPermission();
      return;
    }

    setIsTestingNotification(true);
    try {
      await NotificationService.testNotification();
    } catch (error) {
      console.error('Test notification failed:', error);
    } finally {
      setIsTestingNotification(false);
    }
  };

  // Update preference
  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // Save preferences to profile
  const savePreferences = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const updatedPreferences = {
        ...profile.preferences,
        notifications: preferences
      };

      await updateProfile({ preferences: updatedPreferences });
      
      // Setup or teardown geofencing based on preferences
      if (preferences.location_reminders && preferences.enabled) {
        const setup = await NotificationService.setupGeofencing();
        setGeofencingEnabled(setup);
      } else {
        NotificationService.stopGeofencing();
        setGeofencingEnabled(false);
      }
      
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get permission status color and icon
  const getPermissionIndicator = () => {
    switch (permissionStatus) {
      case 'granted':
        return { color: 'text-green-600', icon: '✅', text: 'Granted' };
      case 'denied':
        return { color: 'text-red-600', icon: '❌', text: 'Denied' };
      default:
        return { color: 'text-yellow-600', icon: '⚠️', text: 'Not Requested' };
    }
  };

  const permissionIndicator = getPermissionIndicator();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Configure how and when you receive reminders
        </p>
      </div>

      {/* Permission Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Permission Status
          </h3>
          <div className={`flex items-center gap-2 ${permissionIndicator.color}`}>
            <span>{permissionIndicator.icon}</span>
            <span className="font-medium">{permissionIndicator.text}</span>
          </div>
        </div>

        {permissionStatus !== 'granted' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              Notifications are not enabled. Click the button below to enable them and receive task reminders.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {permissionStatus !== 'granted' && (
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-primary-40 text-white rounded-lg hover:bg-primary-40/90 transition-colors"
            >
              Enable Notifications
            </button>
          )}
          
          <button
            onClick={testNotification}
            disabled={isTestingNotification || permissionStatus !== 'granted'}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTestingNotification ? 'Sending...' : 'Test Notification'}
          </button>
        </div>
      </div>

      {/* General Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          General Settings
        </h3>

        <div className="space-y-4">
          {/* Enable/Disable Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-900 dark:text-white font-medium">
                Enable Notifications
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Receive reminders for your tasks and events
              </p>
            </div>
            <button
              onClick={() => updatePreference('enabled', !preferences.enabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-40 focus:ring-offset-2 ${
                preferences.enabled ? 'bg-primary-40' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-900 dark:text-white font-medium">
                Sound
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Play sound with notifications
              </p>
            </div>
            <button
              onClick={() => updatePreference('sound', !preferences.sound)}
              disabled={!preferences.enabled}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                preferences.sound && preferences.enabled ? 'bg-primary-40' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.sound && preferences.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Vibrate */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-900 dark:text-white font-medium">
                Vibrate
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Vibrate device for notifications (mobile only)
              </p>
            </div>
            <button
              onClick={() => updatePreference('vibrate', !preferences.vibrate)}
              disabled={!preferences.enabled}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                preferences.vibrate && preferences.enabled ? 'bg-primary-40' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.vibrate && preferences.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Default Lead Time */}
          <div>
            <label className="block text-gray-900 dark:text-white font-medium mb-2">
              Default Reminder Time
            </label>
            <select
              value={preferences.default_lead_time}
              onChange={(e) => updatePreference('default_lead_time', parseInt(e.target.value))}
              disabled={!preferences.enabled}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={5}>5 minutes before</option>
              <option value={10}>10 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
              <option value={120}>2 hours before</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Default time to remind you before events and tasks
            </p>
          </div>
        </div>
      </div>

      {/* Location-Based Reminders */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Location-Based Reminders
        </h3>

        <div className="space-y-4">
          {/* Enable Location Reminders */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-900 dark:text-white font-medium">
                Location Reminders
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Get reminded when you arrive at or leave specific locations
              </p>
            </div>
            <button
              onClick={() => updatePreference('location_reminders', !preferences.location_reminders)}
              disabled={!preferences.enabled}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-40 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                preferences.location_reminders && preferences.enabled ? 'bg-primary-40' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  preferences.location_reminders && preferences.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Geofencing Status */}
          {preferences.location_reminders && preferences.enabled && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>{geofencingEnabled ? '✅' : '⚠️'}</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  Geofencing {geofencingEnabled ? 'Active' : 'Setup Required'}
                </span>
              </div>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {geofencingEnabled
                  ? 'Location-based reminders are active and monitoring your position.'
                  : 'Location permission is required for location-based reminders to work.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quiet Hours
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-900 dark:text-white font-medium mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={preferences.quiet_hours_start || '22:00'}
              onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
              disabled={!preferences.enabled}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-gray-900 dark:text-white font-medium mb-2">
              End Time
            </label>
            <input
              type="time"
              value={preferences.quiet_hours_end || '08:00'}
              onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
              disabled={!preferences.enabled}
              className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-40 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Notifications will be silenced during quiet hours (except urgent reminders)
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-6 py-3 bg-primary-40 text-white rounded-lg hover:bg-primary-40/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Browser Support Info */}
      {!NotificationService.isSupported() && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-red-600">❌</span>
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium">
                Notifications Not Supported
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                Your browser doesn't support web notifications. Please use a modern browser like Chrome, Firefox, or Safari.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}