import { Component, computed, inject, signal } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { InstallPromptService } from '../../core/services/install-prompt.service';
import { isIos, isStandalone } from '../../core/utils/platform';

// Whether the app has been installed is a property of this browser/device, not of the
// user's data — it must not travel with a backup restore to a different device, so it's
// tracked here instead of in SettingsService (which is exported/imported wholesale).
const DISMISSED_KEY = 'deckle:install-banner-dismissed';

@Component({
  selector: 'app-install-banner',
  imports: [HlmButton],
  template: `
    @if (visible()) {
      <div class="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5 text-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-5 shrink-0 text-primary">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 16.5V9.75m0 6.75l-3-3m3 3l3-3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
          />
        </svg>

        @if (isIosDevice) {
          <p class="flex-1 text-xs text-muted-foreground">
            Install Deckle for reliable offline storage and reminders: tap Share, then
            "Add to Home Screen".
          </p>
        } @else {
          <p class="flex-1 text-xs text-muted-foreground">
            Install Deckle for reliable offline storage and reminders.
          </p>
          <button hlmBtn size="sm" (click)="install()">Install</button>
        }

        <button
          hlmBtn
          variant="ghost"
          size="icon"
          aria-label="Dismiss"
          class="size-7 shrink-0"
          (click)="dismiss()"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    }
  `,
})
export class InstallBanner {
  private readonly installPromptService = inject(InstallPromptService);

  protected readonly isIosDevice = isIos();
  private readonly dismissed = signal(localStorage.getItem(DISMISSED_KEY) === '1');

  protected readonly visible = computed(
    () =>
      !isStandalone() &&
      !this.dismissed() &&
      (this.isIosDevice || this.installPromptService.canPrompt()),
  );

  async install(): Promise<void> {
    await this.installPromptService.prompt();
    this.dismiss();
  }

  dismiss(): void {
    localStorage.setItem(DISMISSED_KEY, '1');
    this.dismissed.set(true);
  }
}
