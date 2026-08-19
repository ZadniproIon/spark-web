import { useState, useCallback } from 'react';
import { X, RotateCcw, Trash2, Mic } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { format } from 'date-fns';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { toast } from '../lib/toast';

interface RecycleBinModalProps {
  onClose: () => void;
}

function getDaysLeft(trashedAt: string | null | undefined): number {
  if (!trashedAt) return 30;
  const autoDeleteDate = new Date(trashedAt);
  autoDeleteDate.setDate(autoDeleteDate.getDate() + 30);
  const diff = autoDeleteDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function RecycleBinModal({ onClose }: RecycleBinModalProps) {
  const { isClosing, handleClose } = useModalAnimation(onClose);
  const { trashedNotes, restoreNote, deleteForever } = useNotes();
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const handleEmptyAll = useCallback(async () => {
    for (const note of trashedNotes) {
      await deleteForever(note.id);
    }
    setShowEmptyConfirm(false);
    toast.info('Recycle bin emptied');
  }, [trashedNotes, deleteForever]);

  return (
    <div className={`modal-overlay ${isClosing ? 'modal-overlay--closing' : ''}`} onClick={handleClose}>
      <div
        className="modal-content-animated"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          borderRadius: '24px',
          padding: '24px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Recycle bin</span>
            {trashedNotes.length > 0 && (
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {trashedNotes.length}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {trashedNotes.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (showEmptyConfirm) {
                    handleEmptyAll();
                  } else {
                    setShowEmptyConfirm(true);
                  }
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: showEmptyConfirm ? 'rgba(225, 29, 72, 0.12)' : 'var(--bg-card)',
                  border: `1px solid ${showEmptyConfirm ? 'rgba(225, 29, 72, 0.3)' : 'var(--border)'}`,
                  color: showEmptyConfirm ? 'var(--red)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 150ms ease',
                }}
              >
                <Trash2 size={13} />
                <span>{showEmptyConfirm ? 'Confirm empty?' : 'Empty bin'}</span>
              </button>
            )}

            <button
              onClick={handleClose}
              type="button"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Trashed Notes Stream */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
          {trashedNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 16px', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-secondary)' }}>Recycle bin is empty</p>
              <p style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>Notes in the recycle bin are permanently deleted after 30 days</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {trashedNotes.map((note) => {
                const daysLeft = getDaysLeft(note.trashedAt);
                return (
                  <div key={note.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Top Note Card */}
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px 16px 4px 4px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        {note.type === 'voice' && <Mic size={18} style={{ color: 'var(--flame)', flexShrink: 0, marginTop: 2 }} />}
                        <p
                          style={{
                            fontSize: 14,
                            lineHeight: 1.5,
                            color: 'var(--text-primary)',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'anywhere',
                            margin: 0,
                          }}
                        >
                          {note.content}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                          {note.trashedAt ? format(new Date(note.trashedAt), 'MMM d, yyyy • HH:mm') : ''}
                        </span>
                        <span style={{ color: 'var(--flame)', fontWeight: 600 }}>
                          {daysLeft === 1 ? '1 day left' : `${daysLeft} days left`}
                        </span>
                      </div>
                    </div>

                    {/* Split Bottom Buttons */}
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() => restoreNote(note.id)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px 4px 4px 16px',
                          color: 'var(--text-primary)',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 150ms ease',
                        }}
                      >
                        <RotateCcw size={14} />
                        <span>Restore</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteForever(note.id)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px 4px 16px 4px',
                          color: 'var(--red)',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 150ms ease',
                        }}
                      >
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
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
