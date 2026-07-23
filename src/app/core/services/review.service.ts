import { Injectable } from '@angular/core';
import type { Grade } from 'ts-fsrs';
import { db } from '../data/db';
import type { Card } from '../models/card.model';
import { newId } from '../utils/id';
import { FsrsService } from './fsrs.service';

/** Review-session mechanics only (queue building, grading) — see DueCountService for the reactive nav/dashboard counts. */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private readonly fsrs: FsrsService) {}

  /** Builds a due-card queue for a review session (a snapshot — not reactive). */
  async buildQueue(scope?: { projectId?: string; deckId?: string }): Promise<Card[]> {
    const now = new Date();
    let due = await db.cards.where('due').belowOrEqual(now).toArray();

    if (scope?.deckId) {
      due = due.filter((c) => c.deckId === scope.deckId);
    } else if (scope?.projectId) {
      const deckIds = new Set(
        (await db.decks.where('projectId').equals(scope.projectId).primaryKeys()) as string[],
      );
      due = due.filter((c) => deckIds.has(c.deckId));
    }

    return due.sort((a, b) => a.due.getTime() - b.due.getTime());
  }

  /** Grades a card and returns the updated card plus an `undo` to revert the grade (used for the review session's undo toast). */
  async gradeCard(card: Card, rating: Grade): Promise<{ updated: Card; undo: () => Promise<void> }> {
    const now = new Date();
    const { fields, log } = this.fsrs.schedule(card, rating, now);
    const updated: Card = { ...card, ...fields, updatedAt: now };
    const previous = card;
    const logId = newId();

    await db.transaction('rw', db.cards, db.reviewLogs, async () => {
      await db.cards.update(card.id, { ...fields, updatedAt: now });
      await db.reviewLogs.add({
        id: logId,
        cardId: card.id,
        rating,
        state: log.state,
        due: log.due,
        stability: log.stability,
        difficulty: log.difficulty,
        elapsed_days: log.elapsed_days,
        scheduled_days: log.scheduled_days,
        learning_steps: log.learning_steps,
        review: log.review,
      });
    });

    const undo = async () => {
      await db.transaction('rw', db.cards, db.reviewLogs, async () => {
        await db.cards.put(previous);
        await db.reviewLogs.delete(logId);
      });
    };

    return { updated, undo };
  }
}
