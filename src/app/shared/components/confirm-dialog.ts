import { Component, ViewChild, input, output } from '@angular/core';
import { HlmAlertDialog, HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import type { ButtonVariants } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-confirm-dialog',
  imports: [...HlmAlertDialogImports],
  template: `
    <hlm-alert-dialog>
      <ng-template hlmAlertDialogPortal>
        <hlm-alert-dialog-content>
          <hlm-alert-dialog-header>
            <h3 hlmAlertDialogTitle>{{ title() }}</h3>
            <p hlmAlertDialogDescription>{{ description() }}</p>
          </hlm-alert-dialog-header>
          <hlm-alert-dialog-footer>
            <button hlmAlertDialogCancel>{{ cancelLabel() }}</button>
            <button hlmAlertDialogAction [variant]="confirmVariant()" (click)="onConfirm()">
              {{ confirmLabel() }}
            </button>
          </hlm-alert-dialog-footer>
        </hlm-alert-dialog-content>
      </ng-template>
    </hlm-alert-dialog>
  `,
})
export class ConfirmDialog {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly confirmLabel = input('Delete');
  readonly cancelLabel = input('Cancel');
  readonly confirmVariant = input<ButtonVariants['variant']>('destructive');
  readonly confirmed = output<void>();

  @ViewChild(HlmAlertDialog) private readonly dialog?: HlmAlertDialog;

  open(): void {
    this.dialog?.open();
  }

  protected onConfirm(): void {
    this.confirmed.emit();
    this.dialog?.close();
  }
}
