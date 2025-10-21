import {
  getAllNotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings,
  type NotificationTime,
} from './db';

export class NotificationService {
  private static instance: NotificationService;
  private scheduledNotifications: Map<string, number> = new Map();
  private initialized: boolean = false;

  private constructor() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'NOTIFICATION_CLICKED') {
          window.focus();
        }
      });
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    if (this.initialized) return;
    if (typeof window === 'undefined') return;

    this.initialized = true;
    this.checkNotificationSupport();

    if (this.getPermissionStatus() === 'granted') {
      await this.scheduleAllNotifications();
    }
  }

  checkNotificationSupport(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator
    );
  }

  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!this.checkNotificationSupport()) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.checkNotificationSupport()) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await this.scheduleAllNotifications();
      }
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (!this.checkNotificationSupport()) {
      console.warn('Notifications are not supported');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'ventilation-reminder',
          requireInteraction: false,
          ...options,
        });
      } else {
        new Notification(title, {
          icon: '/icon-192.png',
          ...options,
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  async scheduleAllNotifications(): Promise<void> {
    if (Notification.permission !== 'granted') {
      return;
    }

    this.clearAllScheduledNotifications();

    try {
      const allSettings = await getAllNotificationSettings();
      const enabledSettings = allSettings.filter(s => s.enabled);

      for (const settings of enabledSettings) {
        await this.scheduleNotificationsForSettings(settings);
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  private async scheduleNotificationsForSettings(
    settings: NotificationSettings
  ): Promise<void> {
    const enabledTimes = settings.times.filter(t => t.enabled);

    for (const timeConfig of enabledTimes) {
      this.scheduleNotificationAtTime(settings, timeConfig);
    }
  }

  private scheduleNotificationAtTime(
    settings: NotificationSettings,
    timeConfig: NotificationTime
  ): void {
    const now = new Date();
    const [hours, minutes] = timeConfig.time.split(':').map(Number);

    const scheduledTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0
    );

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    const timeoutId = window.setTimeout(() => {
      this.triggerNotification(settings, timeConfig);
      this.scheduleNotificationAtTime(settings, timeConfig);
    }, delay);

    const key = `${settings.id}-${timeConfig.id}`;
    this.scheduledNotifications.set(key, timeoutId);
  }

  private async triggerNotification(
    settings: NotificationSettings,
    timeConfig: NotificationTime
  ): Promise<void> {
    const title = `Zeit zum Luften`;
    let body = `Erinnerung: ${timeConfig.label}`;

    if (settings.apartmentId) {
      body += ` - Zeit fur Ihre Wohnung zu luften`;
    }

    if (settings.roomId) {
      body += ` - Vergessen Sie nicht zu luften`;
    }

    await this.showNotification(title, {
      body,
      tag: `ventilation-${settings.id}-${timeConfig.id}`,
      data: {
        settingsId: settings.id,
        timeId: timeConfig.id,
        apartmentId: settings.apartmentId,
        roomId: settings.roomId,
      },
    });
  }

  private clearAllScheduledNotifications(): void {
    this.scheduledNotifications.forEach(timeoutId => {
      window.clearTimeout(timeoutId);
    });
    this.scheduledNotifications.clear();
  }

  async rescheduleNotificationsForSettings(
    settingsId: string
  ): Promise<void> {
    const keysToDelete: string[] = [];
    this.scheduledNotifications.forEach((timeoutId, key) => {
      if (key.startsWith(`${settingsId}-`)) {
        window.clearTimeout(timeoutId);
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.scheduledNotifications.delete(key);
    });

    const settings = await getNotificationSettings(settingsId);
    if (settings && settings.enabled) {
      await this.scheduleNotificationsForSettings(settings);
    }
  }

  async testNotification(): Promise<void> {
    await this.showNotification('Test-Benachrichtigung', {
      body: 'Benachrichtigungen funktionieren!',
      tag: 'test-notification',
    });
  }

  async disableAllNotifications(): Promise<void> {
    this.clearAllScheduledNotifications();
  }
}

export const notificationService = NotificationService.getInstance();
