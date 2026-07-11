import { useCallback } from 'react';
import { Plus, Mic, Settings, Trash2, User, Sparkles } from 'lucide-react';
import { useStore } from '../lib/store';
import { SparkSearchBar } from './ui/SparkSearchBar';
import { NoteCard } from './NoteCard';
import { AddNoteModal } from './AddNoteModal';
import { VoiceRecorder } from './VoiceRecorder';
import { AuthModal } from './AuthModal';
import { SettingsModal } from './SettingsModal';
import { RecycleBinModal } from './RecycleBinModal';
import { useNotes } from '../hooks/useNotes';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
  const { state, dispatch } = useStore();
  const { notes, searchNotes, searchQuery, addVoiceNote } = useNotes();
  const { user } = useAuth();

  const openModal = useCallback((modal: 'addNote' | 'voiceRecorder' | 'auth' | 'settings' | 'recycleBin') => {
    dispatch({ type: 'OPEN_MODAL', payload: { modal } });
  }, [dispatch]);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, [dispatch]);

  const handleSaveVoice = useCallback((blob: Blob, duration: number) => {
    addVoiceNote(blob, duration);
    closeModal();
  }, [addVoiceNote, closeModal]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          background: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 12px',
        }}
      >
        {/* Logo area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 32 }}>
          <Sparkles size={22} style={{ color: 'var(--flame)' }} />
          <span style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>Spark</span>
        </div>

        {/* New note buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
          <button
            onClick={() => openModal('addNote')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: 'var(--flame)',
              border: 'none',
              borderRadius: 14,
              cursor: 'pointer',
              transition: 'opacity 140ms ease-out',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <Plus size={18} />
            New note
          </button>
          <button
            onClick={() => openModal('voiceRecorder')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              cursor: 'pointer',
              transition: 'background 140ms ease-out',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg)'}
          >
            <Mic size={18} />
            Voice note
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <NavItem icon={<User size={18} />} label={user ? (user.email ?? 'Account') : 'Sign in'} onClick={() => openModal('auth')} />
          <NavItem icon={<Settings size={18} />} label="Settings" onClick={() => openModal('settings')} />
          <NavItem icon={<Trash2 size={18} />} label="Recycle bin" onClick={() => openModal('recycleBin')} />
        </nav>

        {/* Bottom info */}
        <div style={{ padding: '8px', fontSize: 12, color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', marginTop: 'auto', paddingTop: 16 }}>
          Spark v1.0.0
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 32px', maxWidth: 800, margin: '0 auto', width: '100%' }}>
        {/* Guest banner */}
        {!user && (
          <div
            onClick={() => openModal('auth')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              marginBottom: 16,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--text-secondary)',
              transition: 'box-shadow 140ms ease-out',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <User size={14} style={{ color: 'var(--flame)', flexShrink: 0 }} />
            <span>You're on a guest account. <span style={{ color: 'var(--flame)', fontWeight: 600 }}>Sign in</span> to sync your notes.</span>
          </div>
        )}

        {/* Header with search */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Your notes
          </h1>
          <SparkSearchBar value={searchQuery} onChange={searchNotes} />
        </div>

        {/* Notes grid */}
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: 16 }}>{searchQuery ? 'No results found' : 'No notes yet'}</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              {searchQuery ? 'Try a different search' : 'Create your first note to get started'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {state.modal === 'addNote' && <AddNoteModal onClose={closeModal} />}
      {state.modal === 'voiceRecorder' && <VoiceRecorder onSave={handleSaveVoice} onClose={closeModal} />}
      {state.modal === 'auth' && <AuthModal onClose={closeModal} />}
      {state.modal === 'settings' && (
        <SettingsModal onClose={closeModal} onOpenAuth={() => dispatch({ type: 'OPEN_MODAL', payload: { modal: 'auth' } })} />
      )}
      {state.modal === 'recycleBin' && <RecycleBinModal onClose={closeModal} />}
    </div>
  );
}

function NavItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        fontSize: 14,
        color: 'var(--text-secondary)',
        background: 'none',
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'all 140ms ease-out',
        width: '100%',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >
      {icon}
      {label}
    </button>
  );
}
