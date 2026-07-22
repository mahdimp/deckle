import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { db } from '../data/db';
import type { Project } from '../models/project.model';
import { newId } from '../utils/id';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  // Dexie's liveQuery dependency tracking doesn't reliably notify on writes for
  // Collection queries (where/orderBy) piped into toArray/sortBy — fetch the
  // table plainly and sort in JS instead.
  readonly projects: Signal<Project[] | undefined> = toSignal(
    from(
      liveQuery(() =>
        db.projects
          .toArray()
          .then((list) => list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())),
      ),
    ),
  );

  async create(name: string): Promise<Project> {
    const project: Project = { id: newId(), name: name.trim(), createdAt: new Date() };
    await db.projects.add(project);
    return project;
  }

  async rename(id: string, name: string): Promise<void> {
    await db.projects.update(id, { name: name.trim() });
  }

  async remove(id: string): Promise<void> {
    await db.transaction('rw', db.projects, db.decks, db.cards, db.reviewLogs, async () => {
      const deckIds = (await db.decks.where('projectId').equals(id).primaryKeys()) as string[];
      const cardIds = (await db.cards.where('deckId').anyOf(deckIds).primaryKeys()) as string[];
      await db.reviewLogs.where('cardId').anyOf(cardIds).delete();
      await db.cards.where('deckId').anyOf(deckIds).delete();
      await db.decks.where('projectId').equals(id).delete();
      await db.projects.delete(id);
    });
  }
}
