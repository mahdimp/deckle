import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { ProjectService } from '../../core/services/project.service';
import { ConfirmDialog } from '../../shared/components/confirm-dialog';

@Component({
  selector: 'app-project-list',
  imports: [
    FormsModule,
    RouterLink,
    HlmButton,
    HlmInput,
    HlmSkeleton,
    ...HlmCardImports,
    ...HlmEmptyImports,
    ConfirmDialog,
  ],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header>
        <h1 class="text-2xl font-semibold">Projects</h1>
      </header>

      <form class="flex gap-2" (submit)="create($event)">
        <input
          hlmInput
          class="flex-1"
          placeholder="New project name…"
          [(ngModel)]="newName"
          name="newName"
        />
        <button hlmBtn type="submit" [disabled]="!newName().trim()">Add</button>
      </form>

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
            <div hlmEmptyDescription>Create your first project above to start adding decks.</div>
          </div>
        </div>
      } @else {
        <div class="space-y-2">
          @for (project of projects()!; track project.id) {
            <div hlmCard class="flex flex-row items-center gap-2 p-3">
              @if (renamingId() === project.id) {
                <input
                  hlmInput
                  class="flex-1"
                  [(ngModel)]="renameValue"
                  name="renameValue"
                  (keydown.enter)="commitRename(project.id)"
                  (keydown.escape)="renamingId.set(null)"
                  autofocus
                />
                <button hlmBtn size="sm" (click)="commitRename(project.id)">Save</button>
              } @else {
                <a [routerLink]="[project.id]" class="flex-1 truncate font-medium hover:underline">
                  {{ project.name }}
                </a>
                <button
                  hlmBtn
                  variant="ghost"
                  size="icon"
                  aria-label="Rename project"
                  (click)="startRename(project.id, project.name)"
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
                  aria-label="Delete project"
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
                  title="Delete this project?"
                  [description]="deleteDescription(project.name)"
                  (confirmed)="remove(project.id)"
                />
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ProjectList {
  private readonly projectService = inject(ProjectService);

  protected readonly projects = this.projectService.projects;
  protected readonly newName = signal('');
  protected readonly renamingId = signal<string | null>(null);
  protected readonly renameValue = signal('');

  async create(event: Event): Promise<void> {
    event.preventDefault();
    const name = this.newName().trim();
    if (!name) return;
    await this.projectService.create(name);
    this.newName.set('');
  }

  startRename(id: string, currentName: string): void {
    this.renamingId.set(id);
    this.renameValue.set(currentName);
  }

  async commitRename(id: string): Promise<void> {
    const name = this.renameValue().trim();
    if (name) await this.projectService.rename(id, name);
    this.renamingId.set(null);
  }

  async remove(id: string): Promise<void> {
    await this.projectService.remove(id);
  }

  protected deleteDescription(name: string): string {
    return `Delete "${name}" and all its decks and cards? This can't be undone.`;
  }
}
