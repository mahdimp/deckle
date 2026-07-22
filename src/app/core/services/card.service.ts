import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { db } from '../data/db';
import type { Card } from '../models/card.model';
import { FsrsService } from './fsrs.service';
import { parseClozeNumbers } from '../utils/cloze';
import { newId } from '../utils/id';

@Injectable({ providedIn: 'root' })
export class CardService {
  constructor(private readonly fsrs: FsrsService) {}

  cardsForDeck(deckId: string): Signal<Card[] | undefined> {
    return toSignal(
      from(liveQuery(() => db.cards.where('deckId').equals(deckId).sortBy('createdAt'))),
    );
  }

  card(id: string): Signal<Card | undefined> {
    return toSignal(from(liveQuery(() => db.cards.get(id))));
  }

  cardsForNote(noteId: string): Signal<Card[] | undefined> {
    return toSignal(
      from(liveQuery(() => db.cards.where('noteId').equals(noteId).sortBy('clozeIndex'))),
    );
  }

  async createBasic(deckId: string, front: string, back: string): Promise<Card> {
    const id = newId();
    const now = new Date();
    const card: Card = {
      id,
      deckId,
      type: 'basic',
      noteId: id,
      front,
      back,
      createdAt: now,
      updatedAt: now,
      ...this.fsrs.newCardFields(now),
    };
    await db.cards.add(card);
    return card;
  }

  async updateBasic(id: string, front: string, back: string): Promise<void> {
    await db.cards.update(id, { front, back, updatedAt: new Date() });
  }

  /** Creates one sibling card per distinct {{cN::...}} deletion found in the note text. */
  async createCloze(deckId: string, text: string): Promise<Card[]> {
    const numbers = parseClozeNumbers(text);
    if (numbers.length === 0) {
      throw new Error('Cloze note must contain at least one {{c1::...}} deletion.');
    }
    const noteId = newId();
    const now = new Date();
    const cards: Card[] = numbers.map((clozeIndex) => ({
      id: newId(),
      deckId,
      type: 'cloze',
      noteId,
      text,
      clozeIndex,
      createdAt: now,
      updatedAt: now,
      ...this.fsrs.newCardFields(now),
    }));
    await db.cards.bulkAdd(cards);
    return cards;
  }

  /** Updates a cloze note's text across all sibling cards, adding/removing cards as deletions change. */
  async updateCloze(noteId: string, text: string): Promise<void> {
    const existing = await db.cards.where('noteId').equals(noteId).toArray();
    if (existing.length === 0) return;
    const deckId = existing[0].deckId;
    const now = new Date();

    const wantedNumbers = new Set(parseClozeNumbers(text));
    const existingByIndex = new Map(existing.map((c) => [c.clozeIndex!, c]));

    await db.transaction('rw', db.cards, db.reviewLogs, async () => {
      for (const card of existing) {
        if (wantedNumbers.has(card.clozeIndex!)) {
          await db.cards.update(card.id, { text, updatedAt: now });
        } else {
          await db.reviewLogs.where('cardId').equals(card.id).delete();
          await db.cards.delete(card.id);
        }
      }
      const toAdd = [...wantedNumbers].filter((n) => !existingByIndex.has(n));
      if (toAdd.length > 0) {
        const newCards: Card[] = toAdd.map((clozeIndex) => ({
          id: newId(),
          deckId,
          type: 'cloze',
          noteId,
          text,
          clozeIndex,
          createdAt: now,
          updatedAt: now,
          ...this.fsrs.newCardFields(now),
        }));
        await db.cards.bulkAdd(newCards);
      }
    });
  }

  async removeCard(id: string): Promise<void> {
    await db.transaction('rw', db.cards, db.reviewLogs, async () => {
      await db.reviewLogs.where('cardId').equals(id).delete();
      await db.cards.delete(id);
    });
  }

  async removeNote(noteId: string): Promise<void> {
    await db.transaction('rw', db.cards, db.reviewLogs, async () => {
      const ids = (await db.cards.where('noteId').equals(noteId).primaryKeys()) as string[];
      await db.reviewLogs.where('cardId').anyOf(ids).delete();
      await db.cards.where('noteId').equals(noteId).delete();
    });
  }
}
