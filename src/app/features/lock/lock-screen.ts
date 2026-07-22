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
        <div class="space-y-1 text-center">
          <h1 class="text-lg font-semibold">Deckle is locked</h1>
          <p class="text-sm text-muted-foreground">Enter your passphrase to continue.</p>
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
