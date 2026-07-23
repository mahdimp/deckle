import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { Rating } from 'ts-fsrs';
import { db } from '../data/db';

export interface ForecastDay {
  label: string;
  count: number;
}

export interface StatsSnapshot {
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

@Injectable({ providedIn: 'root' })
export class StatsService {
  readonly stats: Signal<StatsSnapshot | undefined> = toSignal(from(liveQuery(() => computeStats())));
}
