import { Component, inject } from '@angular/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSkeleton } from '@spartan-ng/helm/skeleton';
import { StatsService } from '../../core/services/stats.service';

@Component({
  selector: 'app-stats',
  imports: [...HlmCardImports, HlmSkeleton],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header>
        <h1 class="text-2xl font-semibold">Stats</h1>
      </header>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div hlmCard class="p-4">
          @if (stats(); as s) {
            <div class="text-2xl font-bold">{{ s.retentionPct !== null ? s.retentionPct + '%' : '—' }}</div>
          } @else {
            <div hlmSkeleton class="h-8 w-14"></div>
          }
          <div class="mt-1 text-xs text-muted-foreground">Retention rate</div>
        </div>
        <div hlmCard class="p-4">
          @if (stats(); as s) {
            <div class="flex items-center gap-1.5 text-2xl font-bold">
              {{ s.streakDays }}
              @if (s.streakDays > 0) {
                <svg viewBox="0 0 24 24" fill="currentColor" class="size-5 text-success">
                  <path
                    d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.176 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248z"
                  />
                </svg>
              }
            </div>
          } @else {
            <div hlmSkeleton class="h-8 w-10"></div>
          }
          <div class="mt-1 text-xs text-muted-foreground">Day streak</div>
        </div>
        <div hlmCard class="col-span-2 p-4 md:col-span-1">
          @if (stats(); as s) {
            <div class="text-2xl font-bold">{{ s.totalReviews }}</div>
          } @else {
            <div hlmSkeleton class="h-8 w-14"></div>
          }
          <div class="mt-1 text-xs text-muted-foreground">Total reviews</div>
        </div>
      </div>

      <div hlmCard class="p-4">
        <h2 class="mb-4 text-sm font-semibold text-muted-foreground">Next 7 days</h2>
        <div class="flex h-32 items-end justify-between gap-2">
          @for (day of stats()?.forecast ?? []; track day.label) {
            <div class="flex flex-1 flex-col items-center gap-1">
              <span class="text-xs font-medium text-foreground">{{ day.count }}</span>
              <div
                class="w-full rounded-t bg-primary"
                [style.height.px]="barHeight(day.count)"
                [attr.title]="day.label + ': ' + day.count + ' due'"
              ></div>
              <span class="text-[11px] text-muted-foreground">{{ day.label }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class Stats {
  private readonly statsService = inject(StatsService);
  protected readonly stats = this.statsService.stats;

  protected barHeight(count: number): number {
    const max = Math.max(1, ...(this.stats()?.forecast.map((d) => d.count) ?? [1]));
    return Math.max(4, Math.round((count / max) * 96));
  }
}
