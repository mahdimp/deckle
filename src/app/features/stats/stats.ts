import { Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { db } from '../../core/data/db';
import { Rating } from 'ts-fsrs';

interface ForecastDay {
  label: string;
  count: number;
}

interface StatsSnapshot {
  retentionPct: number | null;
  totalReviews: number;
  streakDays: number;
  forecast: ForecastDay[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

async function computeStats(): Promise<StatsSnapshot> {
  // Sequential awaits — Dexie's liveQuery dependency tracking drops subscriptions
  // for tables read inside a Promise.all.
  const logs = await db.reviewLogs.toArray();
  const dueCards = await db.cards.toArray();

  const totalReviews = logs.length;
  const nonAgain = logs.filter((l) => l.rating !== Rating.Again).length;
  const retentionPct = totalReviews > 0 ? Math.round((nonAgain / totalReviews) * 100) : null;

  // Streak: consecutive days (ending today) with at least one review.
  const reviewDays = new Set(logs.map((l) => new Date(l.review).toDateString()));
  let streakDays = 0;
  const cursor = new Date();
  while (reviewDays.has(cursor.toDateString())) {
    streakDays++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // 7-day due forecast.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const forecast: ForecastDay[] = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(startOfToday.getTime() + i * DAY_MS);
    const dayEnd = new Date(dayStart.getTime() + DAY_MS);
    const count = dueCards.filter((c) => c.due >= dayStart && c.due < dayEnd).length;
    const label = i === 0 ? 'Today' : dayStart.toLocaleDateString(undefined, { weekday: 'short' });
    return { label, count };
  });

  return { retentionPct, totalReviews, streakDays, forecast };
}

@Component({
  selector: 'app-stats',
  imports: [...HlmCardImports],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-4 md:p-8">
      <header>
        <h1 class="text-2xl font-semibold">Stats</h1>
      </header>

      <div class="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div hlmCard class="p-4">
          <div class="text-2xl font-bold">
            {{ stats()?.retentionPct !== null ? stats()!.retentionPct + '%' : '—' }}
          </div>
          <div class="text-xs text-muted-foreground">Retention rate</div>
        </div>
        <div hlmCard class="p-4">
          <div class="text-2xl font-bold">{{ stats()?.streakDays ?? 0 }}</div>
          <div class="text-xs text-muted-foreground">Day streak</div>
        </div>
        <div hlmCard class="col-span-2 p-4 md:col-span-1">
          <div class="text-2xl font-bold">{{ stats()?.totalReviews ?? 0 }}</div>
          <div class="text-xs text-muted-foreground">Total reviews</div>
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
  protected readonly stats = toSignal(from(liveQuery(() => computeStats())));

  protected barHeight(count: number): number {
    const max = Math.max(1, ...(this.stats()?.forecast.map((d) => d.count) ?? [1]));
    return Math.max(4, Math.round((count / max) * 96));
  }
}
