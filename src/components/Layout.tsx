import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flame, GitFork, LayoutGrid, MessageCircle, Moon, PanelLeft, Plus, Square, Trash2, UserRoundCog } from 'lucide-react';
import { useStore } from '../lib/store';
import { NoteCard } from './NoteCard';
import { AddNoteModal } from './AddNoteModal';
import { AuthModal } from './AuthModal';
import { SettingsModal } from './SettingsModal';
import { RecycleBinModal } from './RecycleBinModal';
import { SparkSearchBar } from './ui/SparkSearchBar';
import { useNotes } from '../hooks/useNotes';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLayoutMode } from '../hooks/useLayoutMode';
import type { Note } from '../types/note';

type ModalName = 'addNote' | 'voiceRecorder' | 'auth' | 'settings' | 'recycleBin';

function useMasonryColumnCount(): number {
  const [winWidth, setWinWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (winWidth <= 760) return 1;
  if (winWidth <= 1150) return 2;
  return 3;
}

function distributeNotes(notes: Note[], cols: number): Note[][] {
  const columns: Note[][] = Array.from({ length: cols }, () => []);
  notes.forEach((note, i) => columns[i % cols].push(note));
  return columns;
}

export function Layout() {
  const { state, dispatch } = useStore();
  const { notes } = useNotes();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { layoutMode, setLayoutMode } = useLayoutMode();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const colCount = useMasonryColumnCount();
  const columns = useMemo(() => distributeNotes(notes, colCount), [notes, colCount]);

  const openModal = useCallback((modal: ModalName) => {
    dispatch({ type: 'OPEN_MODAL', payload: { modal } });
  }, [dispatch]);

  const closeModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), [dispatch]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'app-shell--sidebar-closed'}`}>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar__top">
          <div className="brand">
            <Flame size={24} aria-hidden="true" />
            <span>Spark</span>
          </div>
          <button className="panel-button" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar">
            <PanelLeft size={22} />
          </button>
        </div>
        <nav className="sidebar__actions">
          <SidebarAction icon={<Plus />} label="New note" onClick={() => openModal('addNote')} />
          <SidebarAction icon={<Trash2 />} label="Recycle bin" onClick={() => openModal('recycleBin')} />
          <SidebarAction icon={<UserRoundCog size={21} />} label="Account settings" onClick={() => openModal(user ? 'settings' : 'auth')} />
          <SidebarAction icon={<Moon size={21} />} label="Theme" onClick={toggleTheme} />
          <SidebarAction icon={<MessageCircle />} label="Send feedback" onClick={() => (window.location.href = 'mailto:?subject=Spark%20feedback')} />
          <SidebarAction icon={<GitFork />} label="GitHub repository" onClick={() => window.open('https://github.com/', '_blank', 'noopener,noreferrer')} />
        </nav>
      </aside>

      {!sidebarOpen && (
        <button className="sidebar-reopen" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
          <PanelLeft size={22} />
        </button>
      )}

      <main className="notes-board">
        <header className="notes-header">
          <div className="notes-header__search">
            <SparkSearchBar
              value={state.searchQuery}
              onChange={(q) => dispatch({ type: 'SET_SEARCH', payload: q })}
            />
          </div>

          <div className="layout-switch" role="radiogroup" aria-label="Layout view mode">
            <button
              type="button"
              className={`layout-switch__btn ${layoutMode === '1col' ? 'layout-switch__btn--active' : ''}`}
              onClick={() => setLayoutMode('1col')}
              title="1 Column View"
              aria-label="1 Column View"
              aria-checked={layoutMode === '1col'}
              role="radio"
            >
              <Square size={16} aria-hidden="true" />
              <span className="layout-switch__text">1 Column</span>
            </button>
            <button
              type="button"
              className={`layout-switch__btn ${layoutMode === 'masonry' ? 'layout-switch__btn--active' : ''}`}
              onClick={() => setLayoutMode('masonry')}
              title="Masonry View"
              aria-label="Masonry View"
              aria-checked={layoutMode === 'masonry'}
              role="radio"
            >
              <LayoutGrid size={16} aria-hidden="true" />
              <span className="layout-switch__text">Masonry</span>
            </button>
          </div>
        </header>

        {notes.length === 0 ? (
          <div className="notes-empty">
            <p>{state.searchQuery ? 'No matching notes found' : 'No notes yet'}</p>
            {!state.searchQuery && (
              <button onClick={() => openModal('addNote')}>Create your first note</button>
            )}
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
      </main>

      {state.modal === 'addNote' && <AddNoteModal onClose={closeModal} />}
      {state.modal === 'voiceRecorder' && <AddNoteModal onClose={closeModal} initialMode="voice" />}
      {state.modal === 'auth' && <AuthModal onClose={closeModal} />}
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
