import { useCallback, useState } from 'react';
import { Flame, GitFork, MessageCircle, Moon, PanelLeft, Plus, Trash2, UserRoundCog } from 'lucide-react';
import { useStore } from '../lib/store';
import { NoteCard } from './NoteCard';
import { AddNoteModal } from './AddNoteModal';
import { VoiceRecorder } from './VoiceRecorder';
import { AuthModal } from './AuthModal';
import { SettingsModal } from './SettingsModal';
import { RecycleBinModal } from './RecycleBinModal';
import { useNotes } from '../hooks/useNotes';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

type ModalName = 'addNote' | 'voiceRecorder' | 'auth' | 'settings' | 'recycleBin';

export function Layout() {
  const { state, dispatch } = useStore();
  const { notes, addVoiceNote } = useNotes();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const openModal = useCallback((modal: ModalName) => {
    dispatch({ type: 'OPEN_MODAL', payload: { modal } });
  }, [dispatch]);
  const closeModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), [dispatch]);
  const handleSaveVoice = useCallback((blob: Blob, duration: number) => {
    addVoiceNote(blob, duration);
    closeModal();
  }, [addVoiceNote, closeModal]);
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'app-shell--sidebar-closed'}`}>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar__top">
          <div className="brand"><Flame size={24} aria-hidden="true" /><span>Spark</span></div>
          <button className="panel-button" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar"><PanelLeft size={22} /></button>
        </div>
        <nav className="sidebar__actions">
          <SidebarAction icon={<Plus />} label="New note" onClick={() => openModal('addNote')} />
          <SidebarAction icon={<Trash2 />} label="Recycle bin" onClick={() => openModal('recycleBin')} />
          <SidebarAction icon={<UserRoundCog size={21} />} label={user ? 'Account settings' : 'Account settings'} onClick={() => openModal(user ? 'settings' : 'auth')} />
          <SidebarAction icon={<Moon size={21} />} label="Theme" onClick={toggleTheme} />
          <SidebarAction icon={<MessageCircle />} label="Send feedback" onClick={() => window.location.href = 'mailto:?subject=Spark%20feedback'} />
          <SidebarAction icon={<GitFork />} label="GitHub repository" onClick={() => window.open('https://github.com/', '_blank', 'noopener,noreferrer')} />
        </nav>
      </aside>

      {!sidebarOpen && <button className="sidebar-reopen" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><PanelLeft size={22} /></button>}

      <main className="notes-board">
        {notes.length === 0 ? (
          <div className="notes-empty">
            <p>No notes yet</p><button onClick={() => openModal('addNote')}>Create your first note</button>
          </div>
        ) : (
          <div className="notes-grid">{notes.map((note) => <NoteCard key={note.id} note={note} />)}</div>
        )}
      </main>

      {state.modal === 'addNote' && <AddNoteModal onClose={closeModal} />}
      {state.modal === 'voiceRecorder' && <VoiceRecorder onSave={handleSaveVoice} onClose={closeModal} />}
      {state.modal === 'auth' && <AuthModal onClose={closeModal} />}
      {state.modal === 'settings' && <SettingsModal onClose={closeModal} onOpenAuth={() => dispatch({ type: 'OPEN_MODAL', payload: { modal: 'auth' } })} />}
      {state.modal === 'recycleBin' && <RecycleBinModal onClose={closeModal} />}
    </div>
  );
}

function SidebarAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className="sidebar-action" onClick={onClick}><span aria-hidden="true">{icon}</span><span>{label}</span></button>;
}
