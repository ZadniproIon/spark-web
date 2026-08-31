import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flame, PanelLeft, Plus, Search, Settings, Trash2, Info } from 'lucide-react';
import { useStore } from '../lib/store';
import { NoteCard } from './NoteCard';
import { AddNoteModal } from './AddNoteModal';
import { EditNoteModal } from './EditNoteModal';
import { AuthModal } from './AuthModal';
import { SettingsModal } from './SettingsModal';
import { RecycleBinModal } from './RecycleBinModal';
import { FloatingTopSearchBar } from './FloatingTopSearchBar';
import { useNotes } from '../hooks/useNotes';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLayoutMode } from '../hooks/useLayoutMode';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import type { Note } from '../types/note';

type ModalName = 'addNote' | 'voiceRecorder' | 'auth' | 'settings' | 'recycleBin' | 'editNote';

function useMasonryColumnCount(): number {
  const [winWidth, setWinWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));

  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (winWidth < 680) return 1;
  if (winWidth <= 1100) return 2;
  return 3;
}

function distributeNotes(notes: Note[], cols: number): Note[][] {
  const columns: Note[][] = Array.from({ length: cols }, () => []);
  notes.forEach((note, i) => columns[i % cols].push(note));
  return columns;
}

export function Layout() {
  const { state, dispatch } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : true));
  const [showSearch, setShowSearch] = useState(() => Boolean(state.searchQuery));
  
  useTheme(); // Ensure global theme and system dark/light change listener are always active
  const { user } = useAuth();

  const { notes } = useNotes();
  const { layoutMode } = useLayoutMode();

  const colCount = useMasonryColumnCount();
  const columns = useMemo(() => distributeNotes(notes, colCount), [notes, colCount]);

  const openModal = useCallback((modal: ModalName, data?: unknown) => {
    dispatch({ type: 'OPEN_MODAL', payload: { modal, data } });
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [dispatch]);

  const closeModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), [dispatch]);

  const handleToggleSearch = useCallback(() => {
    setShowSearch((prev) => {
      const next = !prev;
      if (!next && state.searchQuery) {
        dispatch({ type: 'SET_SEARCH', payload: '' });
      }
      return next;
    });
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [state.searchQuery, dispatch]);

  const handleCloseSearch = useCallback(() => {
    setShowSearch(false);
    if (state.searchQuery) {
      dispatch({ type: 'SET_SEARCH', payload: '' });
    }
  }, [state.searchQuery, dispatch]);

  useKeyboardShortcuts({
    onOpenNewNote: () => openModal('addNote'),
    onToggleSearch: handleToggleSearch,
    onCloseSearch: handleCloseSearch,
  });

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'app-shell--sidebar-closed'}`}>
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar__top">
          <div className="brand">
            <Flame size={24} strokeWidth={2} aria-hidden="true" />
            <span>Spark</span>
          </div>
          <button className="panel-button" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar">
            <PanelLeft size={18} />
          </button>
        </div>
        <nav className="sidebar__actions">
          <SidebarAction icon={<Plus />} label="New note" onClick={() => openModal('addNote')} />
          <SidebarAction icon={<Search />} label="Search" onClick={handleToggleSearch} />
          <SidebarAction icon={<Trash2 />} label="Recycle bin" onClick={() => openModal('recycleBin')} />
          <SidebarAction icon={<Settings size={21} />} label="Settings" onClick={() => openModal('settings')} />
        </nav>
      </aside>

      {!sidebarOpen && (
        <button className="sidebar-reopen" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
          <PanelLeft size={18} />
        </button>
      )}

      <main className="notes-board">
        {!user && (
          <div className="guest-banner-container">
            <button
              type="button"
              className="guest-banner"
              onClick={() => openModal('auth')}
              title="Click to sign in and sync notes to the cloud"
            >
              <Info size={15} />
              <span>You’re on a guest account</span>
            </button>
          </div>
        )}

        {showSearch && (
          <FloatingTopSearchBar
            resultCount={notes.length}
            onClose={handleCloseSearch}
          />
        )}

        {notes.length === 0 ? (
          <div className="notes-empty">
            <p className="notes-empty__title">
              {state.searchQuery ? 'No matching notes found' : 'No notes'}
            </p>
          </div>
        ) : layoutMode === 'masonry' ? (
          <div className="notes-masonry">
            {columns.map((col, ci) => (
              <div key={ci} className="notes-masonry__col">
                {col.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className={`notes-container notes-container--${layoutMode}`}>
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}

        <button
          className="mobile-fab"
          onClick={() => openModal('addNote')}
          aria-label="Create note"
        >
          <Plus size={24} />
        </button>
      </main>

      {state.modal === 'addNote' && <AddNoteModal onClose={closeModal} />}
      {state.modal === 'voiceRecorder' && <AddNoteModal onClose={closeModal} initialMode="voice" />}
      {state.modal === 'auth' && <AuthModal onClose={closeModal} />}
      {state.modal === 'editNote' && Boolean(state.modalData) && (
        <EditNoteModal note={state.modalData as Note} onClose={closeModal} />
      )}
      {state.modal === 'settings' && (
        <SettingsModal
          onClose={closeModal}
          onOpenAuth={() => dispatch({ type: 'OPEN_MODAL', payload: { modal: 'auth' } })}
        />
      )}
      {state.modal === 'recycleBin' && <RecycleBinModal onClose={closeModal} />}
    </div>
  );
}

function SidebarAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className="sidebar-action" onClick={onClick}>
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
