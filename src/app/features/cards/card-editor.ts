import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { CardService } from '../../core/services/card.service';
import { MediaService } from '../../core/services/media.service';
import type { CardType } from '../../core/models/card.model';
import { CardPreview } from '../../shared/components/card-preview';

type ActiveField = 'front' | 'back' | 'text';

@Component({
  selector: 'app-card-editor',
  imports: [FormsModule, RouterLink, HlmButton, HlmLabel, HlmTextarea, CardPreview],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header class="flex items-center justify-between">
        <a [routerLink]="['/projects', projectId(), 'decks', deckId()]" class="text-sm text-muted-foreground hover:underline">
          &larr; Back to deck
        </a>
        @if (noteId()) {
          <button hlmBtn variant="ghost" size="sm" class="text-destructive" (click)="remove()">
            Delete
          </button>
        }
      </header>

      <h1 class="text-2xl font-semibold">{{ noteId() ? 'Edit card' : 'New card' }}</h1>

      @if (!noteId()) {
        <div class="flex gap-2">
          <button
            hlmBtn
            [variant]="type() === 'basic' ? 'default' : 'outline'"
            (click)="type.set('basic')"
          >
            Basic
          </button>
          <button
            hlmBtn
            [variant]="type() === 'cloze' ? 'default' : 'outline'"
            (click)="type.set('cloze')"
          >
            Cloze
          </button>
        </div>
      }

      <div class="flex gap-2">
        <label hlmBtn variant="outline" size="sm" class="cursor-pointer">
          Add image
          <input type="file" accept="image/*" class="hidden" (change)="onFile($event, 'image')" />
        </label>
        <label hlmBtn variant="outline" size="sm" class="cursor-pointer">
          Add audio
          <input type="file" accept="audio/*" class="hidden" (change)="onFile($event, 'audio')" />
        </label>
      </div>

      @if (type() === 'basic') {
        <div class="space-y-1.5">
          <label hlmLabel for="front">Front</label>
          <textarea
            hlmTextarea
            id="front"
            rows="4"
            class="w-full"
            [(ngModel)]="front"
            name="front"
            (focus)="activeField.set('front')"
          ></textarea>
        </div>
        <div class="space-y-1.5">
          <label hlmLabel for="back">Back</label>
          <textarea
            hlmTextarea
            id="back"
            rows="4"
            class="w-full"
            [(ngModel)]="back"
            name="back"
            (focus)="activeField.set('back')"
          ></textarea>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p class="mb-1 text-xs font-medium text-muted-foreground">Front preview</p>
            <app-card-preview [markdown]="front()" />
          </div>
          <div>
            <p class="mb-1 text-xs font-medium text-muted-foreground">Back preview</p>
            <app-card-preview [markdown]="back()" />
          </div>
        </div>
      } @else {
        <div class="space-y-1.5">
          <label hlmLabel for="text">Text</label>
          <p class="text-xs text-muted-foreground">
            Wrap answers in <code>{{ '{{' }}c1::answer{{ '}}' }}</code> — use c2, c3… for more
            than one blank in the same note.
          </p>
          <textarea
            hlmTextarea
            id="text"
            rows="6"
            class="w-full"
            [(ngModel)]="text"
            name="text"
            (focus)="activeField.set('text')"
          ></textarea>
        </div>

        <div>
          <p class="mb-1 text-xs font-medium text-muted-foreground">Preview</p>
          <app-card-preview [markdown]="text()" />
        </div>
      }

      <div class="flex gap-2">
        <button hlmBtn (click)="save()" [disabled]="!canSave()">Save</button>
        <a hlmBtn variant="outline" [routerLink]="['/projects', projectId(), 'decks', deckId()]">Cancel</a>
      </div>
    </div>
  `,
})
export class CardEditor {
  private readonly cardService = inject(CardService);
  private readonly mediaService = inject(MediaService);
  private readonly router = inject(Router);

  readonly projectId = input.required<string>();
  readonly deckId = input.required<string>();
  readonly noteId = input<string | undefined>(undefined);

  protected readonly type = signal<CardType>('basic');
  protected readonly front = signal('');
  protected readonly back = signal('');
  protected readonly text = signal('');
  protected readonly activeField = signal<ActiveField>('front');

  private readonly existingCards = toSignal(
    toObservable(this.noteId).pipe(
      switchMap((noteId) => (noteId ? this.cardService.cardsForNote$(noteId) : Promise.resolve([]))),
    ),
    { initialValue: [] },
  );

  protected readonly canSave = computed(() =>
    this.type() === 'basic' ? this.front().trim().length > 0 : this.text().trim().length > 0,
  );

  constructor() {
    // Prefill the form once the note's cards load (edit mode only).
    let hydrated = false;
    toObservable(this.existingCards)
      .pipe(takeUntilDestroyed())
      .subscribe((cards) => {
        if (hydrated || cards.length === 0) return;
        hydrated = true;
        const first = cards[0];
        this.type.set(first.type);
        if (first.type === 'basic') {
          this.front.set(first.front ?? '');
          this.back.set(first.back ?? '');
        } else {
          this.text.set(first.text ?? '');
          this.activeField.set('text');
        }
      });
  }

  async onFile(event: Event, kind: 'image' | 'audio'): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const id = await this.mediaService.store(file, kind);
    const token = `{{media:${id}}}`;
    const field = this.activeField();
    if (field === 'front') this.front.update((v) => `${v}\n${token}`);
    else if (field === 'back') this.back.update((v) => `${v}\n${token}`);
    else this.text.update((v) => `${v}\n${token}`);
    input.value = '';
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;

    if (this.noteId()) {
      if (this.type() === 'basic') {
        await this.cardService.updateBasic(this.noteId()!, this.front(), this.back());
      } else {
        await this.cardService.updateCloze(this.noteId()!, this.text());
      }
    } else {
      if (this.type() === 'basic') {
        await this.cardService.createBasic(this.deckId(), this.front(), this.back());
      } else {
        await this.cardService.createCloze(this.deckId(), this.text());
      }
    }

    this.router.navigate(['/projects', this.projectId(), 'decks', this.deckId()]);
  }

  async remove(): Promise<void> {
    if (!this.noteId()) return;
    if (!confirm('Delete this card?')) return;
    await this.cardService.removeNote(this.noteId()!);
    this.router.navigate(['/projects', this.projectId(), 'decks', this.deckId()]);
  }
}
