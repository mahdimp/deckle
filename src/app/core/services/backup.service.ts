import { computed, Injectable, Signal } from '@angular/core';
import { db } from '../data/db';
import type { Project } from '../models/project.model';
import type { Deck } from '../models/deck.model';
import type { Card } from '../models/card.model';
import type { ReviewLogEntry } from '../models/review-log.model';
import type { AppSettings } from '../models/settings.model';
import { SettingsService } from './settings.service';

const BACKUP_NUDGE_AFTER_DAYS = 30;

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

function reviveProject(p: Project): Project {
  return { ...p, createdAt: new Date(p.createdAt) };
}
function reviveDeck(d: Deck): Deck {
  return { ...d, createdAt: new Date(d.createdAt) };
}
function reviveCard(c: Card): Card {
  return {
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    due: new Date(c.due),
    last_review: c.last_review ? new Date(c.last_review) : undefined,
  };
}
function reviveReviewLog(r: ReviewLogEntry): ReviewLogEntry {
  return { ...r, due: new Date(r.due), review: new Date(r.review) };
}
function reviveSettings(s: AppSettings): AppSettings {
  return { ...s, lastBackupAt: s.lastBackupAt ? new Date(s.lastBackupAt) : null };
}

@Injectable({ providedIn: 'root' })
export class BackupService {
  constructor(private readonly settingsService: SettingsService) {}

  readonly needsBackupNudge: Signal<boolean> = computed(() => {
    const lastBackupAt = this.settingsService.settings()?.lastBackupAt;
    if (!lastBackupAt) return true;
    const days = (Date.now() - new Date(lastBackupAt).getTime()) / (1000 * 60 * 60 * 24);
    return days >= BACKUP_NUDGE_AFTER_DAYS;
  });

  async downloadBackup(): Promise<void> {
    const [projects, decks, cards, reviewLogs, mediaAssets, settings] = await Promise.all([
      db.projects.toArray(),
      db.decks.toArray(),
      db.cards.toArray(),
      db.reviewLogs.toArray(),
      db.media.toArray(),
      db.settings.get('app'),
    ]);

    const media = await Promise.all(
      mediaAssets.map(async (m) => ({
        id: m.id,
        kind: m.kind,
        mimeType: m.mimeType,
        data: await blobToBase64(m.blob),
        createdAt: m.createdAt,
      })),
    );

    const payload = {
      version: 1 as const,
      exportedAt: new Date().toISOString(),
      projects,
      decks,
      cards,
      reviewLogs,
      media,
      settings: settings ?? null,
    };

    await this.settingsService.update({ lastBackupAt: new Date() });

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deckle-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Replaces all local data with the contents of a previously exported backup file. */
  async importAll(file: File): Promise<void> {
    const payload = JSON.parse(await file.text());

    await db.transaction(
      'rw',
      [db.projects, db.decks, db.cards, db.reviewLogs, db.media, db.settings],
      async () => {
        await Promise.all([
          db.projects.clear(),
          db.decks.clear(),
          db.cards.clear(),
          db.reviewLogs.clear(),
          db.media.clear(),
        ]);

        await db.projects.bulkAdd(payload.projects.map(reviveProject));
        await db.decks.bulkAdd(payload.decks.map(reviveDeck));
        await db.cards.bulkAdd(payload.cards.map(reviveCard));
        await db.reviewLogs.bulkAdd(payload.reviewLogs.map(reviveReviewLog));

        const mediaRows = payload.media.map(
          (m: { id: string; kind: 'image' | 'audio'; mimeType: string; data: string; createdAt: string }) => ({
            id: m.id,
            kind: m.kind,
            mimeType: m.mimeType,
            blob: base64ToBlob(m.data, m.mimeType),
            createdAt: new Date(m.createdAt),
          }),
        );
        await db.media.bulkAdd(mediaRows);

        if (payload.settings) {
          await db.settings.put(reviveSettings(payload.settings));
        }
      },
    );
  }
}
