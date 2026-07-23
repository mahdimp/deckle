import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { db } from '../data/db';

export interface DueDeckSummary {
  deckId: string;
  deckName: string;
  dueCount: number;
}

export interface DueProjectSummary {
  projectId: string;
  projectName: string;
  dueCount: number;
  decks: DueDeckSummary[];
}

/**
 * Reactive due-card counts only — kept separate from ReviewService so the
 * eagerly-mounted app shell's nav badge doesn't drag ts-fsrs (only needed for
 * actual grading) into the initial bundle.
 */
@Injectable({ providedIn: 'root' })
export class DueCountService {
  // Dexie's liveQuery dependency tracking doesn't reliably notify on writes for
  // Collection queries (where/orderBy) piped into toArray/sortBy/count — every
  // query below fetches its table plainly via Table.toArray() and does the
  // filtering/grouping in JS instead.

  /** Due-card counts grouped by project (then deck), for the dashboard. Sorted busiest project first. */
  readonly dueOverview: Signal<DueProjectSummary[] | undefined> = toSignal(
    from(
      liveQuery(async () => {
        const now = Date.now();
        const allCards = await db.cards.toArray();
        const decks = await db.decks.toArray();
        const projects = await db.projects.toArray();

        const dueCards = allCards.filter((c) => c.due.getTime() <= now);
        const deckById = new Map(decks.map((d) => [d.id, d]));
        const projectById = new Map(projects.map((p) => [p.id, p]));

        const deckCounts = new Map<string, number>();
        for (const card of dueCards) {
          deckCounts.set(card.deckId, (deckCounts.get(card.deckId) ?? 0) + 1);
        }

        const byProject = new Map<string, DueProjectSummary>();
        for (const [deckId, dueCount] of deckCounts) {
          const deck = deckById.get(deckId);
          if (!deck) continue;
          const project = projectById.get(deck.projectId);
          if (!project) continue;

          let entry = byProject.get(project.id);
          if (!entry) {
            entry = { projectId: project.id, projectName: project.name, dueCount: 0, decks: [] };
            byProject.set(project.id, entry);
          }
          entry.dueCount += dueCount;
          entry.decks.push({ deckId: deck.id, deckName: deck.name, dueCount });
        }

        return [...byProject.values()].sort((a, b) => b.dueCount - a.dueCount);
      }),
    ),
  );

  readonly totalDue: Signal<number> = toSignal(
    from(
      liveQuery(() =>
        db.cards.toArray().then((cards) => cards.filter((c) => c.due.getTime() <= Date.now()).length),
      ),
    ),
    { initialValue: 0 },
  );
}
