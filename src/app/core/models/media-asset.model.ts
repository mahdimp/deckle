export type MediaKind = 'image' | 'audio';

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  mimeType: string;
  blob: Blob;
  createdAt: Date;
}
