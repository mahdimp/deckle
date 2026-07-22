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
import { db } from '../../core/data/db';
import { DeckService } from '../../core/services/deck.service';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-project-detail',
  imports: [
    FormsModule,
    RouterLink,
    HlmBadge,
    HlmButton,
    HlmInput,
    ...HlmCardImports,
    ...HlmEmptyImports,
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
        <p class="text-sm text-muted-foreground">Loading…</p>
      } @else if (decks()!.length === 0) {
        <div hlmEmpty>
          <div hlmEmptyHeader>
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
                <button hlmBtn variant="ghost" size="sm" (click)="startRename(deck.id, deck.name)">
                  Rename
                </button>
                <button hlmBtn variant="ghost" size="sm" (click)="remove(deck.id, deck.name)">
                  Delete
                </button>
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

  async remove(id: string, name: string): Promise<void> {
    if (!confirm(`Delete "${name}" and all its cards? This can't be undone.`)) return;
    await this.deckService.remove(id);
  }
}
