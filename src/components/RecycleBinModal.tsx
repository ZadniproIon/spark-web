import { X, RotateCcw, Trash2, Mic } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { format } from 'date-fns';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface RecycleBinModalProps {
  onClose: () => void;
}

function getDaysLeft(trashedAt: string): number {
  const autoDeleteDate = new Date(trashedAt);
  autoDeleteDate.setDate(autoDeleteDate.getDate() + 30);
  const diff = autoDeleteDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function RecycleBinModal({ onClose }: RecycleBinModalProps) {
  const { isClosing, handleClose } = useModalAnimation(onClose);
  const { trashedNotes, restoreNote, deleteForever } = useNotes();

  return (
    <div className={`modal-overlay ${isClosing ? 'modal-overlay--closing' : ''}`} onClick={handleClose}>
      <div
        className="modal-content-animated"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '24px',
          padding: '32px',
          width: 'min(100%, 600px)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Recycle bin</span>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', paddingRight: 4, flex: 1 }}>

        {trashedNotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            <p>No notes in the recycle bin</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Deleted notes appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {trashedNotes.map((note) => {
              const daysLeft = note.trashedAt ? getDaysLeft(note.trashedAt) : 30;
              return (
                <div
                  key={note.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '16px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {note.type === 'voice' && <Mic size={16} style={{ color: 'var(--flame)', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {note.content}
                    </p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {note.trashedAt ? format(new Date(note.trashedAt), 'MMM d, yyyy') : ''}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--flame)' }}>{daysLeft} days left</span>
                    </div>
                  </div>
                  <button
                    onClick={() => restoreNote(note.id)}
                    className="modal-close-btn"
                    style={{ background: 'none' }}
                    title="Restore"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    onClick={() => deleteForever(note.id)}
                    className="modal-close-btn"
                    style={{ background: 'none', color: 'var(--red)' }}
                    title="Delete forever"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
