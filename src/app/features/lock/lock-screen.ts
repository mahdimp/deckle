import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { LockService } from '../../core/services/lock.service';

@Component({
  selector: 'app-lock-screen',
  imports: [FormsModule, HlmButton, HlmInput, HlmLabel],
  template: `
    <div class="flex min-h-dvh items-center justify-center bg-background px-4">
      <form class="w-full max-w-xs space-y-4" (submit)="submit($event)">
        <div class="space-y-3 text-center">
          <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-5">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-semibold">Deckle is locked</h1>
            <p class="text-sm text-muted-foreground">Enter your passphrase to continue.</p>
          </div>
        </div>

        <div class="space-y-1.5">
          <label hlmLabel for="passphrase">Passphrase</label>
          <input
            hlmInput
            id="passphrase"
            type="password"
            autofocus
            class="w-full"
            [(ngModel)]="passphrase"
            name="passphrase"
          />
        </div>

        @if (error()) {
          <p class="text-sm text-destructive">Incorrect passphrase — try again.</p>
        }

        <button hlmBtn type="submit" class="w-full">Unlock</button>
      </form>
    </div>
  `,
})
export class LockScreen {
  private readonly lockService = inject(LockService);

  protected readonly passphrase = signal('');
  protected readonly error = signal(false);

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    const ok = await this.lockService.tryUnlock(this.passphrase());
    this.error.set(!ok);
    if (ok) this.passphrase.set('');
  }
}
