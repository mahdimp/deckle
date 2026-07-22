import { effect, Injectable, signal } from '@angular/core';
import type { Theme } from '../models/settings.model';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly systemPrefersDark = signal(this.currentSystemPreference());

  constructor(private readonly settingsService: SettingsService) {
    window
      .matchMedia?.('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => this.systemPrefersDark.set(e.matches));

    effect(() => {
      const theme = this.settingsService.settings()?.theme ?? 'system';
      const dark = theme === 'dark' || (theme === 'system' && this.systemPrefersDark());
      document.documentElement.classList.toggle('dark', dark);
    });
  }

  async setTheme(theme: Theme): Promise<void> {
    await this.settingsService.update({ theme });
  }

  private currentSystemPreference(): boolean {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
