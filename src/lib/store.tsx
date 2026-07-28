import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type { Note, ThemePreference, LayoutMode, ModalType } from '../types/note';

export interface AppState {
  notes: Note[];
  user: import('@supabase/supabase-js').User | null;
  theme: ThemePreference;
  layoutMode: LayoutMode;
  haptics: boolean;
  isLoading: boolean;
  searchQuery: string;
  modal: ModalType;
  modalData: unknown;
}

type Action =
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'SET_USER'; payload: import('@supabase/supabase-js').User | null }
  | { type: 'SET_THEME'; payload: ThemePreference }
  | { type: 'SET_LAYOUT_MODE'; payload: LayoutMode }
  | { type: 'SET_HAPTICS'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'OPEN_MODAL'; payload: { modal: ModalType; data?: unknown } }
  | { type: 'CLOSE_MODAL' };

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem('spark_notes');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadLayoutMode(): LayoutMode {
  const saved = localStorage.getItem('spark_layout_mode');
  return saved === '1col' ? '1col' : 'masonry';
}

const initialState: AppState = {
  notes: loadNotes(),
  user: null,
  theme: (localStorage.getItem('theme') as ThemePreference) || 'system',
  layoutMode: loadLayoutMode(),
  haptics: localStorage.getItem('haptics') !== 'false',
  isLoading: false,
  searchQuery: '',
  modal: null,
  modalData: null,
};

function persistNotes(notes: Note[]) {
  localStorage.setItem('spark_notes', JSON.stringify(notes));
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_NOTES':
      persistNotes(action.payload);
      return { ...state, notes: action.payload };
    case 'ADD_NOTE': {
      const notes = [action.payload, ...state.notes];
      persistNotes(notes);
      return { ...state, notes };
    }
    case 'UPDATE_NOTE': {
      const notes = state.notes.map((n) => (n.id === action.payload.id ? action.payload : n));
      persistNotes(notes);
      return { ...state, notes };
    }
    case 'DELETE_NOTE': {
      const notes = state.notes.filter((n) => n.id !== action.payload);
      persistNotes(notes);
      return { ...state, notes };
    }
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_THEME':
      localStorage.setItem('theme', action.payload);
      return { ...state, theme: action.payload };
    case 'SET_LAYOUT_MODE':
      localStorage.setItem('spark_layout_mode', action.payload);
      return { ...state, layoutMode: action.payload };
    case 'SET_HAPTICS':
      localStorage.setItem('haptics', String(action.payload));
      return { ...state, haptics: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };
    case 'OPEN_MODAL':
      return { ...state, modal: action.payload.modal, modalData: action.payload.data ?? null };
    case 'CLOSE_MODAL':
      return { ...state, modal: null, modalData: null };
    default:
      return state;
  }
}

interface StoreContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const StoreContext = createContext<StoreContextValue | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
