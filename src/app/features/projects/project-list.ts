import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmInput } from '@spartan-ng/helm/input';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-project-list',
  imports: [FormsModule, RouterLink, HlmButton, HlmInput, ...HlmCardImports, ...HlmEmptyImports],
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
        <p class="text-sm text-muted-foreground">Loading…</p>
      } @else if (projects()!.length === 0) {
        <div hlmEmpty>
          <div hlmEmptyHeader>
            <div hlmEmptyTitle>No projects yet</div>
            <div hlmEmptyDescription>Create your first project above to start adding decks.</div>
          </div>
        </div>
      } @else {
        <div class="space-y-2">
          @for (project of projects()!; track project.id) {
            <div hlmCard class="flex items-center gap-2 p-3">
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
                <button hlmBtn variant="ghost" size="sm" (click)="startRename(project.id, project.name)">
                  Rename
                </button>
                <button hlmBtn variant="ghost" size="sm" (click)="remove(project.id, project.name)">
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

  async remove(id: string, name: string): Promise<void> {
    if (!confirm(`Delete "${name}" and all its decks and cards? This can't be undone.`)) return;
    await this.projectService.remove(id);
  }
}
