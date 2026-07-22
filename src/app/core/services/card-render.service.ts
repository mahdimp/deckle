import { Injectable } from '@angular/core';
import { marked } from 'marked';
import { db } from '../data/db';
import { MediaService } from './media.service';

const MEDIA_TOKEN_RE = /\{\{media:([\w-]+)\}\}/g;

@Injectable({ providedIn: 'root' })
export class CardRenderService {
  constructor(private readonly mediaService: MediaService) {}

  /** Renders markdown (with {{media:ID}} embeds already resolved) to sanitizable HTML. */
  async render(markdownText: string): Promise<string> {
    const withMedia = await this.resolveMediaTokens(markdownText);
    return marked.parse(withMedia, { async: false });
  }

  private async resolveMediaTokens(text: string): Promise<string> {
    const ids = [...text.matchAll(MEDIA_TOKEN_RE)].map((m) => m[1]);
    if (ids.length === 0) return text;

    const replacements = new Map<string, string>();
    for (const id of [...new Set(ids)]) {
      const [asset, url] = await Promise.all([db.media.get(id), this.mediaService.urlFor(id)]);
      if (!asset || !url) {
        replacements.set(id, '');
        continue;
      }
      replacements.set(
        id,
        asset.kind === 'image'
          ? `<img src="${url}" class="my-2 max-w-full rounded-lg" alt="" />`
          : `<audio controls src="${url}" class="my-2 w-full"></audio>`,
      );
    }

    return text.replace(MEDIA_TOKEN_RE, (_match, id: string) => replacements.get(id) ?? '');
  }
}
