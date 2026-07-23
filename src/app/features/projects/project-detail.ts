import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { liveQuery } from 'dexie';
import { from, switchMap } from 'rxjs';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { db } from '../../core/data/db';
import { DeckService } from '../../core/services/deck.service';
import { ProjectService } from '../../core/services/project.service';
import { ConfirmDialog } from '../../shared/components/confirm-dialog';

@Component({
  selector: 'app-project-detail',
  imports: [
    FormsModule,
    RouterLink,
    HlmBadge,
    HlmButton,
    HlmInput,
    HlmSkeleton,
    ...HlmCardImports,
    ...HlmEmptyImports,
    ConfirmDialog,
  ],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header class="flex items-center justify-between gap-2">
        <div>
          <a routerLink="/projects" class="text-sm text-muted-foreground hover:underline"
            >&larr; Projects</a
          >
          <h1 class="text-2xl font-semibold">{{ project()?.name ?? '…' }}</h1>
        </div>
        @if (dueInProject() > 0) {
          <a hlmBtn [routerLink]="['/review']" [queryParams]="{ projectId: projectId() }">
            Review {{ dueInProject() }}
          </a>
        }
      </header>

      <form class="flex gap-2" (submit)="create($event)">
        <input
          hlmInput
          class="flex-1"
          placeholder="New deck name…"
          [(ngModel)]="newName"
          name="newName"
        />
        <button hlmBtn type="submit" [disabled]="!newName().trim()">Add</button>
      </form>

      @if (decks() === undefined) {
        <div class="space-y-2">
          <div hlmSkeleton class="h-14 w-full"></div>
          <div hlmSkeleton class="h-14 w-full"></div>
        </div>
      } @else if (decks()!.length === 0) {
        <div hlmEmpty>
          <div hlmEmptyHeader>
            <div hlmEmptyMedia variant="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-4">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12h1.313M8.25 18h7.5m-7.5-3h7.5m-7.5-3h1.5m-1.5 0H6.75"
                />
              </svg>
            </div>
            <div hlmEmptyTitle>No decks yet</div>
            <div hlmEmptyDescription>Add a deck above to start adding cards.</div>
          </div>
        </div>
      } @else {
        <div class="space-y-2">
          @for (deck of decks()!; track deck.id) {
            <div hlmCard class="flex flex-row items-center gap-2 p-3">
              @if (renamingId() === deck.id) {
                <input
                  hlmInput
                  class="flex-1"
                  [(ngModel)]="renameValue"
                  name="renameValue"
                  (keydown.enter)="commitRename(deck.id)"
                  (keydown.escape)="renamingId.set(null)"
                  autofocus
                />
                <button hlmBtn size="sm" (click)="commitRename(deck.id)">Save</button>
              } @else {
                <a
                  [routerLink]="['decks', deck.id]"
                  class="flex-1 truncate font-medium hover:underline"
                >
                  {{ deck.name }}
                </a>
                @if (dueByDeck()[deck.id]) {
                  <span hlmBadge>{{ dueByDeck()[deck.id] }}</span>
                }
                <button
                  hlmBtn
                  variant="ghost"
                  size="icon"
                  aria-label="Rename deck"
                  (click)="startRename(deck.id, deck.name)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-4">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                    />
                  </svg>
                </button>
                <button
                  hlmBtn
                  variant="ghost"
                  size="icon"
                  class="text-destructive"
                  aria-label="Delete deck"
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
                  title="Delete this deck?"
                  [description]="deleteDescription(deck.name)"
                  (confirmed)="remove(deck.id)"
                />
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ProjectDetail {
  private readonly projectService = inject(ProjectService);
  private readonly deckService = inject(DeckService);

  readonly projectId = input.required<string>();

  protected readonly project = computed(() =>
    this.projectService.projects()?.find((p) => p.id === this.projectId()),
  );

  protected readonly decks = toSignal(
    toObservable(this.projectId).pipe(
      switchMap((projectId) => this.deckService.decksForProject$(projectId)),
    ),
  );

  protected readonly newName = signal('');
  protected readonly renamingId = signal<string | null>(null);
  protected readonly renameValue = signal('');

  // Table.toArray() + JS filter, not Collection.where().toArray() — see the note
  // in review.service.ts about Dexie's liveQuery dependency tracking.
  protected readonly dueByDeck = toSignal(
    from(
      liveQuery(async () => {
        const now = Date.now();
        const cards = await db.cards.toArray();
        const counts: Record<string, number> = {};
        for (const c of cards) {
          if (c.due.getTime() <= now) counts[c.deckId] = (counts[c.deckId] ?? 0) + 1;
        }
        return counts;
      }),
    ),
    { initialValue: {} as Record<string, number> },
  );

  protected readonly dueInProject = computed(() => {
    const decks = this.decks() ?? [];
    const counts = this.dueByDeck();
    return decks.reduce((sum, d) => sum + (counts[d.id] ?? 0), 0);
  });

  async create(event: Event): Promise<void> {
    event.preventDefault();
    const name = this.newName().trim();
    if (!name) return;
    await this.deckService.create(this.projectId(), name);
    this.newName.set('');
  }

  startRename(id: string, currentName: string): void {
    this.renamingId.set(id);
    this.renameValue.set(currentName);
  }

  async commitRename(id: string): Promise<void> {
    const name = this.renameValue().trim();
    if (name) await this.deckService.rename(id, name);
    this.renamingId.set(null);
  }

  async remove(id: string): Promise<void> {
    await this.deckService.remove(id);
  }

  protected deleteDescription(name: string): string {
    return `Delete "${name}" and all its cards? This can't be undone.`;
  }
}
