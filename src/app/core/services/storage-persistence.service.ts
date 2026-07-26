import { Injectable, signal } from '@angular/core';

/**
 * Without persistent storage, the browser treats IndexedDB as "best-effort" and can
 * silently evict it under disk pressure (or, on some browsers, after a period of
 * inactivity) — which for Deckle means losing every card's review history. This asks
 * the browser to exempt this origin from that eviction.
 */
@Injectable({ providedIn: 'root' })
export class StoragePersistenceService {
  readonly supported = 'storage' in navigator && 'persist' in navigator.storage;
  readonly persisted = signal(false);

  /** Call once at app startup. Chrome grants/denies this silently based on site-engagement
   * heuristics; Firefox may show a one-time permission prompt; Safari doesn't support the
   * API at all. Safe to call unconditionally — an already-decided origin won't re-prompt. */
  async init(): Promise<void> {
    if (!this.supported) return;
    if (await navigator.storage.persisted()) {
      this.persisted.set(true);
      return;
    }
    this.persisted.set(await navigator.storage.persist());
  }

  /** User-initiated retry, for when the silent startup attempt wasn't granted. */
  async request(): Promise<boolean> {
    if (!this.supported) return false;
    const granted = await navigator.storage.persist();
    this.persisted.set(granted);
    return granted;
  }
}
