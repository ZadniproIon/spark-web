import { useState, useCallback, useRef, useEffect } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { updateNote } = useNotes();
  const { isClosing, handleClose } = useModalAnimation(onClose);

  useEffect(() => {
    if (textareaRef.current) {
      const len = textareaRef.current.value.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(len, len);
    }
  }, []);

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
          width: 'min(100%, 550px)',
          maxHeight: 'min(90dvh, 580px)',
          background: 'var(--bg)',
          borderRadius: '24px',
          padding: 'clamp(16px, 4vw, 20px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
          transition: 'all 200ms ease',
        }}
      >
        {note.type === 'voice' && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
            Voice note text content
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={(e) => {
            const len = e.currentTarget.value.length;
            e.currentTarget.setSelectionRange(len, len);
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="Type here..."
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
            gap: '10px',
            width: '100%',
          }}
        >
          <button
            onClick={handleClose}
            type="button"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-button)',
              padding: '10px 16px',
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!content.trim()}
            type="button"
            style={{
              background: 'var(--flame)',
              border: '1px solid var(--flame)',
              borderRadius: 'var(--radius-button)',
              padding: '10px 18px',
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600,
              color: '#ffffff',
              cursor: content.trim() ? 'pointer' : 'not-allowed',
              opacity: content.trim() ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
