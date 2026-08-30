import { useState, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { toast } from '../lib/toast';
import type { Note } from '../types/note';

interface EditNoteModalProps {
  note: Note;
  onClose: () => void;
}

export function EditNoteModal({ note, onClose }: EditNoteModalProps) {
  const [content, setContent] = useState(note.content);
  const { updateNote } = useNotes();
  const { isClosing, handleClose } = useModalAnimation(onClose);

  const handleSave = useCallback(() => {
    if (content.trim() && content.trim() !== note.content) {
      updateNote(note.id, { content: content.trim() }, true);
      toast.success('Note updated');
    }
    handleClose();
  }, [content, note.id, note.content, updateNote, handleClose]);

  return (
    <div className={`modal-overlay ${isClosing ? 'modal-overlay--closing' : ''}`} onClick={handleClose}>
      <div
        className="modal-content-animated"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '550px',
          background: 'var(--bg)',
          borderRadius: '24px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
          transition: 'all 200ms ease',
        }}
      >
        {note.type === 'voice' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--flame)', fontSize: 13, fontWeight: 500 }}>
            <Mic size={15} />
            <span>Voice note text content</span>
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="Type here..."
          autoFocus
          rows={8}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '16px',
            fontSize: '16px',
            fontFamily: 'DM Sans, var(--font-sans)',
            fontWeight: 400,
            lineHeight: 1.4,
            color: 'var(--text-primary)',
            resize: 'none',
            fieldSizing: 'content',
            minHeight: 'calc(8lh + 32px)',
            maxHeight: 'calc(12lh + 32px)',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '16px',
            width: '100%',
          }}
        >
          <button
            onClick={handleClose}
            type="button"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '16px',
              fontFamily: 'Inter, var(--font-sans)',
              fontWeight: 400,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 150ms ease, border-color 150ms ease',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            type="button"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--flame)',
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '16px',
              fontFamily: 'Inter, var(--font-sans)',
              fontWeight: 400,
              color: 'var(--flame)',
              cursor: content.trim() ? 'pointer' : 'not-allowed',
              opacity: content.trim() ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 150ms ease',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
