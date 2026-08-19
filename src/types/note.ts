export type NoteType = 'text' | 'voice';

export interface Note {
  id: string;
  type: NoteType;
  content: string;
  audioPath: string | null;
  audioUrl: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  isPinned: boolean;
  isTrashed: boolean;
  trashedAt: string | null;
  isSynced: boolean;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export type LayoutMode = '1col' | 'masonry';

export type SearchDesign = 'spotlight' | 'floating' | 'sidebar';

export type ModalType =
  | 'addNote'
  | 'voiceRecorder'
  | 'editNote'
  | 'auth'
  | 'settings'
  | 'recycleBin'
  | 'contextMenu'
  | 'voicePlayer'
  | 'changeEmail'
  | 'changePassword'
  | 'deleteAccount'
  | 'terms'
  | 'spotlightSearch'
  | null;

export interface ModalState {
  type: ModalType;
  data?: unknown;
}
