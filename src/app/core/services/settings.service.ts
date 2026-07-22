import { Injectable, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { from } from 'rxjs';
import { db } from '../data/db';
import { DEFAULT_SETTINGS, type AppSettings } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly settings: Signal<AppSettings | undefined> = toSignal(
    from(liveQuery(() => db.settings.get('app'))),
  );

  async ensureDefaults(): Promise<void> {
    const existing = await db.settings.get('app');
    if (!existing) {
      await db.settings.add(DEFAULT_SETTINGS);
    }
  }

  async update(patch: Partial<AppSettings>): Promise<void> {
    await db.settings.update('app', patch);
  }
}
