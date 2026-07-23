import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { DeckService } from '../../core/services/deck.service';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-quick-add',
  imports: [FormsModule, RouterLink, HlmButton, HlmInput, HlmSkeleton, ...HlmCardImports, ...HlmEmptyImports],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold">New card</h1>
        <p class="text-sm text-muted-foreground">Pick a deck to add it to.</p>
      </header>

      @if (projects() === undefined) {
        <div class="space-y-2">
          <div hlmSkeleton class="h-14 w-full"></div>
          <div hlmSkeleton class="h-14 w-full"></div>
        </div>
      } @else if (projects()!.length === 0) {
        <div hlmEmpty>
          <div hlmEmptyHeader>
            <div hlmEmptyMedia variant="icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-4">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0v6a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-6m-19.5 0h19.5M4.5 9.75V6a2.25 2.25 0 012.25-2.25h4.5a2.25 2.25 0 011.591.659l1.409 1.409a2.25 2.25 0 001.591.659H19.5a2.25 2.25 0 012.25 2.25v.75"
                />
              </svg>
            </div>
            <div hlmEmptyTitle>No projects yet</div>
            <div hlmEmptyDescription>Create a project first, then come back here to add cards.</div>
          </div>
          <a hlmBtn routerLink="/projects">Create a project</a>
        </div>
      } @else {
        <div class="space-y-4">
          @for (project of projects()!; track project.id) {
            <div hlmCard class="p-4">
              <h2 class="mb-2 text-sm font-semibold">{{ project.name }}</h2>

              @if (decksByProject()[project.id]?.length) {
                <div class="space-y-1.5">
                  @for (deck of decksByProject()[project.id]; track deck.id) {
                    <a
                      [routerLink]="['/projects', project.id, 'decks', deck.id, 'new']"
                      class="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted"
                    >
                      {{ deck.name }}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-4 text-muted-foreground">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </a>
                  }
                </div>
              } @else {
                <p class="mb-2 text-xs text-muted-foreground">No decks yet.</p>
              }

              <form class="mt-2 flex gap-2" (submit)="createDeck($event, project.id)">
                <input
                  hlmInput
                  class="flex-1"
                  placeholder="New deck name…"
                  [ngModel]="newDeckNames()[project.id] ?? ''"
                  (ngModelChange)="setNewDeckName(project.id, $event)"
                  [name]="'newDeck-' + project.id"
                />
                <button hlmBtn size="sm" variant="outline" type="submit">Add deck</button>
              </form>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class QuickAdd {
  private readonly projectService = inject(ProjectService);
  private readonly deckService = inject(DeckService);
  private readonly router = inject(Router);

  protected readonly projects = this.projectService.projects;
  private readonly decks = this.deckService.decks;

  protected readonly newDeckNames = signal<Record<string, string>>({});

  protected readonly decksByProject = computed(() => {
    const decks = this.decks() ?? [];
    const byProject: Record<string, typeof decks> = {};
    for (const deck of decks) {
      (byProject[deck.projectId] ??= []).push(deck);
    }
    return byProject;
  });

  setNewDeckName(projectId: string, value: string): void {
    this.newDeckNames.update((names) => ({ ...names, [projectId]: value }));
  }

  async createDeck(event: Event, projectId: string): Promise<void> {
    event.preventDefault();
    const name = (this.newDeckNames()[projectId] ?? '').trim();
    if (!name) return;
    const deck = await this.deckService.create(projectId, name);
    this.setNewDeckName(projectId, '');
    this.router.navigate(['/projects', projectId, 'decks', deck.id, 'new']);
  }
}
