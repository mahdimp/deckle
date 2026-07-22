import { Injectable } from '@angular/core';
import { ReviewService } from './review.service';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private lastNotifiedDateKey: string | null = null;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly reviewService: ReviewService,
  ) {}

  get permission(): NotificationPermission {
    return 'Notification' in window ? Notification.permission : 'denied';
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied';
    return Notification.requestPermission();
  }

  /** Starts the in-app reminder check loop — call once at app startup. */
  init(): void {
    this.checkAndNotify();
    window.setInterval(() => this.checkAndNotify(), 60_000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.checkAndNotify();
    });
  }

  private checkAndNotify(): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const settings = this.settingsService.settings();
    if (!settings?.reminderTime) return;

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    if (this.lastNotifiedDateKey === todayKey) return;

    const [hours, minutes] = settings.reminderTime.split(':').map(Number);
    const reminderMoment = new Date(now);
    reminderMoment.setHours(hours, minutes, 0, 0);
    if (now < reminderMoment) return;

    const due = this.reviewService.totalDue();
    if (due < settings.reminderThreshold) return;

    new Notification('Deckle', {
      body: `You have ${due} card${due === 1 ? '' : 's'} due for review.`,
    });
    this.lastNotifiedDateKey = todayKey;
  }
}
