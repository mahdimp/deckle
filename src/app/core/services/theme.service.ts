import { computed, effect, Injectable, signal } from '@angular/core';
import type { Theme } from '../models/settings.model';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly systemPrefersDark = signal(this.currentSystemPreference());

  readonly isDark = computed(() => {
    const theme = this.settingsService.settings()?.theme ?? 'system';
    return theme === 'dark' || (theme === 'system' && this.systemPrefersDark());
  });

  constructor(private readonly settingsService: SettingsService) {
    window
      .matchMedia?.('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => this.systemPrefersDark.set(e.matches));

    effect(() => {
      document.documentElement.classList.toggle('dark', this.isDark());
    });
  }

  async setTheme(theme: Theme): Promise<void> {
    await this.settingsService.update({ theme });
  }

  toggle(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  private currentSystemPreference(): boolean {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
