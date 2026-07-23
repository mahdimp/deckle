import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { BackupService } from '../../core/services/backup.service';
import { DueCountService } from '../../core/services/due-count.service';
import { StatsService } from '../../core/services/stats.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, HlmBadge, HlmButton, HlmSkeleton, ...HlmCardImports, ...HlmEmptyImports],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header class="flex items-center justify-between gap-2">
        <div class="space-y-1">
          <h1 class="text-2xl font-semibold">Dashboard</h1>
          <p class="text-sm text-muted-foreground">Here's what's due today.</p>
        </div>
        @if ((streakDays() ?? 0) > 0) {
          <span
            class="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-sm font-medium text-success"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" class="size-4">
              <path
                d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.176 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248z"
              />
            </svg>
            {{ streakDays() }}
          </span>
        }
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
        @if (totalDue() > 0) {
          <a hlmBtn size="lg" routerLink="/review">Review all</a>
        } @else {
          <button hlmBtn size="lg" disabled aria-disabled="true">Review all</button>
        }
      </div>

      <section class="space-y-3">
        <h2 class="text-sm font-semibold text-muted-foreground">By project</h2>

        @if (dueOverview() === undefined) {
          <div class="space-y-2">
            <div hlmSkeleton class="h-14 w-full"></div>
            <div hlmSkeleton class="h-14 w-full"></div>
          </div>
        } @else if (dueOverview()!.length === 0) {
          <div hlmEmpty>
            <div hlmEmptyHeader>
              <div hlmEmptyMedia variant="icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-4">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
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
                class="flex flex-row items-center justify-between p-4 hover:bg-muted"
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
  protected readonly dueCountService = inject(DueCountService);
  protected readonly backupService = inject(BackupService);
  private readonly statsService = inject(StatsService);

  protected readonly totalDue = this.dueCountService.totalDue;
  protected readonly dueOverview = this.dueCountService.dueOverview;
  protected readonly streakDays = () => this.statsService.stats()?.streakDays;
}
