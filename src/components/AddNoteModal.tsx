import { useState, useCallback } from 'react';
import { X, Send } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';

interface AddNoteModalProps {
  onClose: () => void;
}

export function AddNoteModal({ onClose }: AddNoteModalProps) {
  const [content, setContent] = useState('');
  const { addTextNote } = useNotes();

  const handleSend = useCallback(() => {
    if (content.trim()) {
      addTextNote(content.trim());
      onClose();
    }
  }, [content, addTextNote, onClose]);

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
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>New note</span>
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
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type here..."
          autoFocus
          style={{
            width: '100%',
            minHeight: 200,
            padding: 16,
            fontSize: 16,
            color: 'var(--text-primary)',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            resize: 'vertical',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1.6,
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <button
            onClick={handleSend}
            disabled={!content.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: 'none',
              background: content.trim() ? 'var(--flame)' : 'var(--border)',
              cursor: content.trim() ? 'pointer' : 'not-allowed',
              color: content.trim() ? '#fff' : 'var(--text-secondary)',
              transition: 'all 140ms ease-out',
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
