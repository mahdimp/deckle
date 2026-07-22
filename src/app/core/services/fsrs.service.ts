import { Injectable } from '@angular/core';
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card as FsrsCard,
  type Grade,
} from 'ts-fsrs';
import type { Card } from '../models/card.model';

export interface GradePreview {
  rating: Grade;
  due: Date;
  intervalDays: number;
}

const f = fsrs(generatorParameters({ enable_fuzz: true }));

/** Fields owned by ts-fsrs on a Card row — kept in sync by schedule()/newCardFields(). */
type FsrsFields = Pick<
  Card,
  | 'due'
  | 'stability'
  | 'difficulty'
  | 'elapsed_days'
  | 'scheduled_days'
  | 'learning_steps'
  | 'reps'
  | 'lapses'
  | 'state'
  | 'last_review'
>;

function toFsrsCard(card: FsrsFields): FsrsCard {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review,
  };
}

@Injectable({ providedIn: 'root' })
export class FsrsService {
  /** FSRS fields for a freshly-created card, due immediately. */
  newCardFields(now: Date = new Date()): FsrsFields {
    return createEmptyCard(now);
  }

  /** Next-interval preview for each grade, used to label the Again/Hard/Good/Easy buttons. */
  previewGrades(card: FsrsFields, now: Date = new Date()): GradePreview[] {
    const record = f.repeat(toFsrsCard(card), now);
    return ([Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as const).map((rating) => {
      const item = record[rating];
      const intervalDays = Math.round(
        (item.card.due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return { rating, due: item.card.due, intervalDays };
    });
  }

  /** Applies a grade, returning the updated FSRS fields plus a review-log entry to persist. */
  schedule(card: FsrsFields, rating: Grade, now: Date = new Date()) {
    const { card: updated, log } = f.next(toFsrsCard(card), now, rating);
    return { fields: updated as FsrsFields, log };
  }
}

export { Rating, State } from 'ts-fsrs';
export type { Grade } from 'ts-fsrs';
