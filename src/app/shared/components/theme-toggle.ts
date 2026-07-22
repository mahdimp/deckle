import { Component, inject } from '@angular/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [HlmButton],
  template: `
    <button
      hlmBtn
      variant="ghost"
      size="icon"
      type="button"
      (click)="themeService.toggle()"
      [attr.aria-label]="themeService.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      @if (themeService.isDark()) {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-4.5">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 3v1.5m0 15V21m8.485-8.485h-1.5m-13.97 0H3m14.849-6.35l-1.06 1.06M6.212 17.788l-1.06 1.06m12.727 0l-1.06-1.06M6.212 6.212l-1.06-1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
          />
        </svg>
      } @else {
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-4.5">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
      }
    </button>
  `,
})
export class ThemeToggle {
  protected readonly themeService = inject(ThemeService);
}
