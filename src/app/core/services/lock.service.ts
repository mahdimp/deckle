import { computed, Injectable, signal } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class LockService {
  private readonly sessionUnlocked = signal(false);

  constructor(private readonly settingsService: SettingsService) {}

  /** True while a passphrase gate is configured and hasn't been unlocked this session. */
  readonly locked = computed(() => {
    const settings = this.settingsService.settings();
    if (!settings?.lockEnabled) return false;
    return !this.sessionUnlocked();
  });

  /** True whenever a passphrase gate is configured, regardless of current session state. */
  readonly isEnabled = computed(() => this.settingsService.settings()?.lockEnabled ?? false);

  async setPassphrase(passphrase: string): Promise<void> {
    const hash = await this.hashPassphrase(passphrase);
    await this.settingsService.update({ passphraseHash: hash, lockEnabled: true });
    this.sessionUnlocked.set(true);
  }

  async disable(): Promise<void> {
    await this.settingsService.update({ passphraseHash: null, lockEnabled: false });
  }

  async tryUnlock(passphrase: string): Promise<boolean> {
    const settings = this.settingsService.settings();
    if (!settings?.passphraseHash) return false;
    const hash = await this.hashPassphrase(passphrase);
    const ok = hash === settings.passphraseHash;
    if (ok) this.sessionUnlocked.set(true);
    return ok;
  }

  lockNow(): void {
    this.sessionUnlocked.set(false);
  }

  private async hashPassphrase(passphrase: string): Promise<string> {
    const bytes = new TextEncoder().encode(passphrase);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
