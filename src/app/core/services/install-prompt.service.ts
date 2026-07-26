import { Injectable, signal } from '@angular/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Chrome/Edge (desktop and Android) only allow triggering the native install prompt
 * from a 'beforeinstallprompt' event captured earlier — the browser won't hand out a
 * fresh one on demand, so it must be stashed as soon as it fires, before any component
 * asks for it.
 */
@Injectable({ providedIn: 'root' })
export class InstallPromptService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  readonly canPrompt = signal(false);

  /** Call once at app startup, so an early-firing event isn't missed. */
  init(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.canPrompt.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canPrompt.set(false);
    });
  }

  async prompt(): Promise<void> {
    if (!this.deferredPrompt) return;
    await this.deferredPrompt.prompt();
    await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.canPrompt.set(false);
  }
}
