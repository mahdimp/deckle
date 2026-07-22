import { Injectable } from '@angular/core';
import { db } from '../data/db';
import type { MediaKind } from '../models/media-asset.model';
import { newId } from '../utils/id';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly objectUrls = new Map<string, string>();

  async store(blob: Blob, kind: MediaKind): Promise<string> {
    const id = newId();
    await db.media.add({ id, kind, mimeType: blob.type, blob, createdAt: new Date() });
    return id;
  }

  async remove(id: string): Promise<void> {
    this.revoke(id);
    await db.media.delete(id);
  }

  /** Returns a cached object URL for a stored media blob, creating one on first access. */
  async urlFor(id: string): Promise<string | undefined> {
    const cached = this.objectUrls.get(id);
    if (cached) return cached;

    const asset = await db.media.get(id);
    if (!asset) return undefined;

    const url = URL.createObjectURL(asset.blob);
    this.objectUrls.set(id, url);
    return url;
  }

  private revoke(id: string): void {
    const url = this.objectUrls.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      this.objectUrls.delete(id);
    }
  }
}
