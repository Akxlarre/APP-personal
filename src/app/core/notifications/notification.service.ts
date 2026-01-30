import { Injectable, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';

export interface ScheduleNotificationOptions {
  id: number;
  title: string;
  body: string;
  at: Date;
  extra?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private hasPermissions = signal(false);

  async requestPermissions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const result = await LocalNotifications.requestPermissions();
    const granted = result.display === 'granted';
    this.hasPermissions.set(granted);
    return granted;
  }

  async scheduleBlockReminder(options: ScheduleNotificationOptions): Promise<void> {
    if (!this.hasPermissions() || !Capacitor.isNativePlatform()) {
      return;
    }
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({
      notifications: [
        {
          id: options.id,
          title: options.title,
          body: options.body,
          schedule: { at: options.at },
          sound: 'default',
          extra: options.extra ?? {},
        },
      ],
    });
  }

  async cancelNotification(id: number): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({ notifications: [{ id }] });
  }

  async getPending(): Promise<{ id: number; title?: string; body?: string }[]> {
    if (!Capacitor.isNativePlatform()) return [];
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { notifications } = await LocalNotifications.getPending();
    return notifications;
  }
}
