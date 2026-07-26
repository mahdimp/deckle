import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmTabs, HlmTabsList, HlmTabsTrigger } from '@spartan-ng/helm/tabs';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { CardService } from '../../core/services/card.service';
import { MediaService } from '../../core/services/media.service';
import type { CardType } from '../../core/models/card.model';
import { CardPreview } from '../../shared/components/card-preview';
import { ConfirmDialog } from '../../shared/components/confirm-dialog';

type ActiveField = 'front' | 'back' | 'text';

@Component({
  selector: 'app-card-editor',
  imports: [
    FormsModule,
    RouterLink,
    HlmButton,
    HlmLabel,
    HlmTabs,
    HlmTabsList,
    HlmTabsTrigger,
    HlmTextarea,
    CardPreview,
    ConfirmDialog,
  ],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-4 pb-24 md:p-8">
      <header class="flex items-center justify-between">
        <a [routerLink]="['/projects', projectId(), 'decks', deckId()]" class="text-sm text-muted-foreground hover:underline">
          &larr; Back to deck
        </a>
        @if (noteId()) {
          <button
            hlmBtn
            variant="ghost"
            size="sm"
            class="text-destructive"
            aria-label="Delete card"
            (click)="deleteConfirm.open()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-4">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
          <app-confirm-dialog
            #deleteConfirm
            title="Delete this card?"
            description="This can't be undone."
            (confirmed)="remove()"
          />
        }
      </header>

      <h1 class="text-2xl font-semibold">{{ noteId() ? 'Edit card' : 'New card' }}</h1>

      @if (!noteId()) {
        <div hlmTabs [tab]="type()" (tabActivated)="onTabActivated($event)">
          <div hlmTabsList>
            <button hlmTabsTrigger="basic">Basic</button>
            <button hlmTabsTrigger="cloze">Cloze</button>
          </div>
        </div>
      }

      <div class="space-y-1.5">
        <div class="flex flex-wrap gap-2">
          <label hlmBtn variant="outline" size="sm" class="cursor-pointer">
            Add image
            <input type="file" accept="image/*" class="hidden" (change)="onFile($event, 'image')" />
          </label>
          <label hlmBtn variant="outline" size="sm" class="cursor-pointer">
            Add audio
            <input type="file" accept="audio/*" class="hidden" (change)="onFile($event, 'audio')" />
          </label>
        </div>
        <p class="text-xs text-muted-foreground">Inserted into the focused field</p>
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
    </div>

    <div
      class="sticky bottom-16 z-10 flex gap-2 border-t border-border bg-background/95 p-4 backdrop-blur md:bottom-0 md:p-8"
    >
      <div class="mx-auto flex w-full max-w-2xl gap-2">
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

  onTabActivated(tab: string): void {
    if (tab === 'basic' || tab === 'cloze') this.type.set(tab);
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
    await this.cardService.removeNote(this.noteId()!);
    this.router.navigate(['/projects', this.projectId(), 'decks', this.deckId()]);
  }
}
