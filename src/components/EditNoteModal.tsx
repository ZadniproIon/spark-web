import { useState, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import type { Note } from '../types/note';

interface EditNoteModalProps {
  note: Note;
  onClose: () => void;
}

export function EditNoteModal({ note, onClose }: EditNoteModalProps) {
  const [content, setContent] = useState(note.content);
  const { updateNote } = useNotes();

  const handleSave = useCallback(() => {
    if (content.trim()) {
      updateNote(note.id, { content });
    }
    onClose();
  }, [content, note.id, updateNote, onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          padding: 24,
          width: 'min(90vw, 600px)',
          boxShadow: 'var(--shadow-2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Edit note</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid var(--border)',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
              }}
            >
              <X size={18} />
            </button>
            <button
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: '1px solid var(--flame)',
                background: 'var(--flame)',
                cursor: 'pointer',
                color: '#fff',
              }}
            >
              <Check size={18} />
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            minHeight: 200,
            padding: 16,
            fontSize: 14,
            color: 'var(--text-primary)',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            resize: 'vertical',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.6,
          }}
        />
      </div>
    </div>
  );
}
