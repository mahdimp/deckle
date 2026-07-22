import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { BackupService } from '../../core/services/backup.service';
import { LockService } from '../../core/services/lock.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { ThemeToggle } from '../../shared/components/theme-toggle';

@Component({
  selector: 'app-settings',
  imports: [
    FormsModule,
    HlmButton,
    HlmInput,
    HlmLabel,
    ThemeToggle,
    ...HlmCardImports,
  ],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header>
        <h1 class="text-2xl font-semibold">Settings</h1>
      </header>

      <section hlmCard class="space-y-3 p-4">
        <h2 class="text-sm font-semibold text-muted-foreground">Appearance</h2>
        <div class="flex items-center justify-between">
          <span class="text-sm">Theme</span>
          <app-theme-toggle />
        </div>
      </section>

      <section hlmCard class="space-y-3 p-4">
        <h2 class="text-sm font-semibold text-muted-foreground">Reminders</h2>

        <div class="flex items-center justify-between gap-4">
          <label hlmLabel for="reminderTime">Daily reminder time</label>
          <input
            hlmInput
            id="reminderTime"
            type="time"
            class="w-32"
            [ngModel]="reminderTime()"
            (ngModelChange)="setReminderTime($event)"
            name="reminderTime"
          />
        </div>

        <div class="flex items-center justify-between gap-4">
          <label hlmLabel for="reminderThreshold">Minimum cards due to notify</label>
          <input
            hlmInput
            id="reminderThreshold"
            type="number"
            min="1"
            class="w-20"
            [ngModel]="reminderThreshold()"
            (ngModelChange)="setReminderThreshold($event)"
            name="reminderThreshold"
          />
        </div>

        @if (notificationPermission() !== 'granted') {
          <button hlmBtn variant="outline" size="sm" (click)="requestNotifications()">
            Enable browser notifications
          </button>
        } @else {
          <p class="text-xs text-muted-foreground">Browser notifications are enabled.</p>
        }
      </section>

      <section hlmCard class="space-y-3 p-4">
        <h2 class="text-sm font-semibold text-muted-foreground">Passphrase lock</h2>

        @if (!lockService.isEnabled()) {
          <form class="flex items-end gap-2" (submit)="enableLock($event)">
            <div class="flex-1 space-y-1.5">
              <label hlmLabel for="newPassphrase">Set a passphrase</label>
              <input
                hlmInput
                id="newPassphrase"
                type="password"
                class="w-full"
                [(ngModel)]="newPassphrase"
                name="newPassphrase"
              />
            </div>
            <button hlmBtn type="submit" [disabled]="!newPassphrase().trim()">Enable</button>
          </form>
        } @else {
          <div class="flex items-center justify-between">
            <p class="text-sm">Deckle is locked with a passphrase.</p>
            <button hlmBtn variant="outline" size="sm" (click)="disableLock()">Disable</button>
          </div>
        }
      </section>

      <section hlmCard class="space-y-3 p-4">
        <h2 class="text-sm font-semibold text-muted-foreground">Backup</h2>
        <p class="text-xs text-muted-foreground">
          @if (lastBackupAt()) {
            Last backup: {{ lastBackupAt()!.toLocaleString() }}
          } @else {
            You haven't backed up yet.
          }
        </p>
        <div class="flex gap-2">
          <button hlmBtn variant="outline" size="sm" (click)="downloadBackup()">
            Export backup (.json)
          </button>
          <label hlmBtn variant="outline" size="sm" class="cursor-pointer">
            Import backup
            <input type="file" accept="application/json" class="hidden" (change)="importBackup($event)" />
          </label>
        </div>
      </section>
    </div>
  `,
})
export class Settings {
  protected readonly settingsService = inject(SettingsService);
  protected readonly lockService = inject(LockService);
  protected readonly backupService = inject(BackupService);
  private readonly notificationService = inject(NotificationService);

  protected readonly newPassphrase = signal('');
  protected readonly notificationPermission = signal(this.notificationService.permission);

  protected readonly reminderTime = computed(() => this.settingsService.settings()?.reminderTime ?? '');
  protected readonly reminderThreshold = computed(
    () => this.settingsService.settings()?.reminderThreshold ?? 1,
  );
  protected readonly lastBackupAt = computed(() => {
    const value = this.settingsService.settings()?.lastBackupAt;
    return value ? new Date(value) : null;
  });

  async setReminderTime(value: string): Promise<void> {
    await this.settingsService.update({ reminderTime: value || null });
  }

  async setReminderThreshold(value: number): Promise<void> {
    await this.settingsService.update({ reminderThreshold: Math.max(1, Number(value) || 1) });
  }

  async requestNotifications(): Promise<void> {
    const permission = await this.notificationService.requestPermission();
    this.notificationPermission.set(permission);
  }

  async enableLock(event: Event): Promise<void> {
    event.preventDefault();
    const passphrase = this.newPassphrase().trim();
    if (!passphrase) return;
    await this.lockService.setPassphrase(passphrase);
    this.newPassphrase.set('');
  }

  async disableLock(): Promise<void> {
    if (!confirm('Disable the passphrase lock?')) return;
    await this.lockService.disable();
  }

  downloadBackup(): void {
    this.backupService.downloadBackup();
  }

  async importBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!confirm('Importing will replace all current data with this backup. Continue?')) {
      input.value = '';
      return;
    }
    await this.backupService.importAll(file);
    input.value = '';
  }
}
