import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from, type Observable } from 'rxjs';
import { db } from '../data/db';
import type { Deck } from '../models/deck.model';
import { newId } from '../utils/id';

@Injectable({ providedIn: 'root' })
export class DeckService {
  readonly decks: Signal<Deck[] | undefined> = toSignal(
    from(liveQuery(() => db.decks.orderBy('createdAt').toArray())),
  );

  /** Observable form — use with toObservable(idSignal).pipe(switchMap(...)) when the id can change without recreating the component. */
  decksForProject$(projectId: string): Observable<Deck[]> {
    return from(liveQuery(() => db.decks.where('projectId').equals(projectId).sortBy('createdAt')));
  }

  deck$(id: string): Observable<Deck | undefined> {
    return from(liveQuery(() => db.decks.get(id)));
  }

  async create(projectId: string, name: string): Promise<Deck> {
    const deck: Deck = { id: newId(), projectId, name: name.trim(), createdAt: new Date() };
    await db.decks.add(deck);
    return deck;
  }

  async rename(id: string, name: string): Promise<void> {
    await db.decks.update(id, { name: name.trim() });
  }

  async remove(id: string): Promise<void> {
    await db.transaction('rw', db.decks, db.cards, db.reviewLogs, async () => {
      const cardIds = (await db.cards.where('deckId').equals(id).primaryKeys()) as string[];
      await db.reviewLogs.where('cardId').anyOf(cardIds).delete();
      await db.cards.where('deckId').equals(id).delete();
      await db.decks.delete(id);
    });
  }
}
