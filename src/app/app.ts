import { Component, inject } from '@angular/core';
import { HlmToaster } from '@spartan-ng/helm/sonner';
import { LockScreen } from './features/lock/lock-screen';
import { LockService } from './core/services/lock.service';
import { NotificationService } from './core/services/notification.service';
import { AppShell } from './shared/layout/app-shell';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [AppShell, LockScreen, HlmToaster],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly lockService = inject(LockService);

  // Instantiated here to start their effects/timers as soon as the app boots.
  private readonly themeService = inject(ThemeService);
  private readonly notificationService = inject(NotificationService);

  constructor() {
    this.notificationService.init();
  }
}
