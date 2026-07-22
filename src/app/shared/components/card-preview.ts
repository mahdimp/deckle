import { Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { CardRenderService } from '../../core/services/card-render.service';

@Component({
  selector: 'app-card-preview',
  template: `<div class="prose prose-sm dark:prose-invert max-w-none" [innerHTML]="html()"></div>`,
})
export class CardPreview {
  private readonly cardRenderService = inject(CardRenderService);

  readonly markdown = input.required<string>();

  protected readonly html = toSignal(
    toObservable(this.markdown).pipe(switchMap((md) => this.cardRenderService.render(md))),
    { initialValue: '' },
  );
}
