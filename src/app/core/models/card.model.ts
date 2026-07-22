import type { State } from 'ts-fsrs';

export type CardType = 'basic' | 'cloze';

export interface Card {
  id: string;
  deckId: string;
  type: CardType;
  /** Groups sibling cards generated from the same note (cloze cards share a noteId; a basic card's noteId equals its own id). */
  noteId: string;
  /** Basic cards only. */
  front?: string;
  back?: string;
  /** Cloze cards only: markdown containing `{{c1::answer}}` style deletions. */
  text?: string;
  /** Cloze cards only: which deletion number this specific card tests. */
  clozeIndex?: number;
  createdAt: Date;
  updatedAt: Date;

  // FSRS scheduling state (mirrors ts-fsrs's Card shape).
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: Date;
}
