import Dexie, { type EntityTable } from 'dexie';
import type { Project } from '../models/project.model';
import type { Deck } from '../models/deck.model';
import type { Card } from '../models/card.model';
import type { ReviewLogEntry } from '../models/review-log.model';
import type { MediaAsset } from '../models/media-asset.model';
import type { AppSettings } from '../models/settings.model';

export class DeckleDatabase extends Dexie {
  projects!: EntityTable<Project, 'id'>;
  decks!: EntityTable<Deck, 'id'>;
  cards!: EntityTable<Card, 'id'>;
  reviewLogs!: EntityTable<ReviewLogEntry, 'id'>;
  media!: EntityTable<MediaAsset, 'id'>;
  settings!: EntityTable<AppSettings, 'id'>;

  constructor() {
    super('deckle');

    this.version(1).stores({
      projects: 'id, name, createdAt',
      decks: 'id, projectId, name, createdAt',
      cards: 'id, deckId, noteId, type, due, state, createdAt',
      reviewLogs: 'id, cardId, review',
      media: 'id, kind, createdAt',
      settings: 'id',
    });
  }
}

export const db = new DeckleDatabase();
