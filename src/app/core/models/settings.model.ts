export type Theme = 'light' | 'dark' | 'system';

/** Singleton row — always fetched/updated by the fixed id 'app'. */
export interface AppSettings {
  id: 'app';
  theme: Theme;
  reminderTime: string | null;
  reminderThreshold: number;
  lockEnabled: boolean;
  passphraseHash: string | null;
  lastBackupAt: Date | null;
}

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app',
  theme: 'system',
  reminderTime: null,
  reminderThreshold: 1,
  lockEnabled: false,
  passphraseHash: null,
  lastBackupAt: null,
};
