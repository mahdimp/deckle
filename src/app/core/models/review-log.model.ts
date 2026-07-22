import type { Rating, State } from 'ts-fsrs';

export interface ReviewLogEntry {
  id: string;
  cardId: string;
  rating: Rating;
  state: State;
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  review: Date;
}
