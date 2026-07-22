import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { BackupService } from '../../core/services/backup.service';
import { ReviewService } from '../../core/services/review.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, HlmBadge, HlmButton, ...HlmCardImports, ...HlmEmptyImports],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header class="space-y-1">
        <h1 class="text-2xl font-semibold">Dashboard</h1>
        <p class="text-sm text-muted-foreground">Here's what's due today.</p>
      </header>

      @if (backupService.needsBackupNudge()) {
        <div hlmCard class="border-amber-500/40 bg-amber-500/5 p-4">
          <p class="text-sm">
            You haven't backed up your data in a while.
            <a routerLink="/settings" class="font-medium underline underline-offset-2">Back it up</a>
            to be safe.
          </p>
        </div>
      }

      <div hlmCard class="flex flex-col items-center gap-4 p-8 text-center">
        <div class="text-4xl font-bold">{{ totalDue() }}</div>
        <p class="text-sm text-muted-foreground">
          card{{ totalDue() === 1 ? '' : 's' }} due for review
        </p>
        <a hlmBtn size="lg" routerLink="/review" [class.opacity-50]="totalDue() === 0">
          Review all
        </a>
      </div>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold text-muted-foreground">By project</h2>

        @if (dueOverview() === undefined) {
          <p class="text-sm text-muted-foreground">Loading…</p>
        } @else if (dueOverview()!.length === 0) {
          <div hlmEmpty>
            <div hlmEmptyHeader>
              <div hlmEmptyTitle>Nothing due right now</div>
              <div hlmEmptyDescription>
                Add a project and some cards to get started, or check back later.
              </div>
            </div>
            <a hlmBtn variant="outline" routerLink="/projects">Go to projects</a>
          </div>
        } @else {
          <div class="space-y-2">
            @for (project of dueOverview(); track project.projectId) {
              <a
                [routerLink]="['/review']"
                [queryParams]="{ projectId: project.projectId }"
                hlmCard
                class="flex items-center justify-between p-4 hover:bg-muted"
              >
                <span class="font-medium">{{ project.projectName }}</span>
                <span hlmBadge>{{ project.dueCount }}</span>
              </a>
            }
          </div>
        }
      </section>
    </div>
  `,
})
export class Dashboard {
  protected readonly reviewService = inject(ReviewService);
  protected readonly backupService = inject(BackupService);

  protected readonly totalDue = this.reviewService.totalDue;
  protected readonly dueOverview = this.reviewService.dueOverview;
}
