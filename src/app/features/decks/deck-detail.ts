import { Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { CardService } from '../../core/services/card.service';
import { DeckService } from '../../core/services/deck.service';

@Component({
  selector: 'app-deck-detail',
  imports: [RouterLink, HlmBadge, HlmButton, HlmSkeleton, ...HlmCardImports, ...HlmEmptyImports],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header class="flex items-center justify-between gap-2">
        <div>
          <a
            [routerLink]="['/projects', projectId()]"
            class="text-sm text-muted-foreground hover:underline"
            >&larr; Project</a
          >
          <h1 class="text-2xl font-semibold">{{ deck()?.name ?? '…' }}</h1>
        </div>
        <div class="flex gap-2">
          @if (dueCount() > 0) {
            <a hlmBtn [routerLink]="['/review']" [queryParams]="{ deckId: deckId() }">
              Review {{ dueCount() }}
            </a>
          }
          <a hlmBtn variant="outline" [routerLink]="['new']">Add card</a>
        </div>
      </header>

      @if (notes() === undefined) {
        <div class="space-y-2">
          <div hlmSkeleton class="h-12 w-full"></div>
          <div hlmSkeleton class="h-12 w-full"></div>
        </div>
      } @else if (notes()!.length === 0) {
        <div hlmEmpty>
          <div hlmEmptyHeader>
            <div hlmEmptyMedia variant="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-4">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3M3.75 6h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z"
                />
              </svg>
            </div>
            <div hlmEmptyTitle>No cards yet</div>
            <div hlmEmptyDescription>Add your first card above.</div>
          </div>
        </div>
      } @else {
        <div class="space-y-2">
          @for (note of notes()!; track note.noteId) {
            <a [routerLink]="['notes', note.noteId]" hlmCard class="flex flex-row items-center gap-2 p-3 hover:bg-muted">
              <span class="flex-1 truncate text-sm">{{ note.preview }}</span>
              @if (note.dueCount > 0) {
                <span hlmBadge>{{ note.dueCount }}</span>
              }
            </a>
          }
        </div>
      }
    </div>
  `,
})
export class DeckDetail {
  private readonly deckService = inject(DeckService);
  private readonly cardService = inject(CardService);

  readonly projectId = input.required<string>();
  readonly deckId = input.required<string>();

  protected readonly deck = toSignal(
    toObservable(this.deckId).pipe(switchMap((deckId) => this.deckService.deck$(deckId))),
  );

  private readonly cards = toSignal(
    toObservable(this.deckId).pipe(switchMap((deckId) => this.cardService.cardsForDeck$(deckId))),
  );

  protected readonly dueCount = computed(() => {
    const now = Date.now();
    return (this.cards() ?? []).filter((c) => c.due.getTime() <= now).length;
  });

  protected readonly notes = computed(() => {
    const cards = this.cards();
    if (!cards) return undefined;

    const now = Date.now();
    const byNote = new Map<string, { preview: string; dueCount: number; createdAt: Date }>();
    for (const card of cards) {
      const existing = byNote.get(card.noteId);
      const isDue = card.due.getTime() <= now;
      if (existing) {
        existing.dueCount += isDue ? 1 : 0;
      } else {
        const raw = card.type === 'basic' ? (card.front ?? '') : (card.text ?? '');
        byNote.set(card.noteId, {
          preview: raw.replace(/\s+/g, ' ').trim().slice(0, 120) || '(empty)',
          dueCount: isDue ? 1 : 0,
          createdAt: card.createdAt,
        });
      }
    }
    return [...byNote.entries()]
      .map(([noteId, v]) => ({ noteId, ...v }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });
}
