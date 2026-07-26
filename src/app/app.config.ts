import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { InstallPromptService } from './core/services/install-prompt.service';
import { SettingsService } from './core/services/settings.service';
import { StoragePersistenceService } from './core/services/storage-persistence.service';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideAppInitializer(() => inject(SettingsService).ensureDefaults()),
    provideAppInitializer(() => inject(StoragePersistenceService).init()),
    provideAppInitializer(() => inject(InstallPromptService).init()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
