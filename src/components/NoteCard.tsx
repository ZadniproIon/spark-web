import { useState, useCallback } from 'react';
import { Mic, Pin as PinIcon, Circle } from 'lucide-react';
import { ContextMenu } from './ui/ContextMenu';
import { VoicePlayerSheet } from './VoicePlayerSheet';
import { EditNoteModal } from './EditNoteModal';
import type { Note } from '../types/note';

function parseLocalDate(str: string): Date {
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]));
  return new Date(str);
}

function formatNoteDisplay(note: Note): string {
  const d = parseLocalDate(note.updatedAtLocal ?? note.updatedAt);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} - ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function renderContentWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part.startsWith('http') ? part : `https://${part}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--flame)', textDecoration: 'underline' }}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const [showContext, setShowContext] = useState(false);
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 });
  const [showEdit, setShowEdit] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextPos({ x: e.clientX, y: e.clientY });
    setShowContext(true);
  }, []);

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${note.isPinned ? 'var(--flame)' : 'var(--border)'}`,
          borderRadius: '16px',
          padding: '16px 20px',
          cursor: 'pointer',
          transition: 'box-shadow 140ms ease-out',
          boxShadow: note.isPinned ? 'var(--shadow-1)' : 'none',
        }}
        onMouseEnter={(e) => { if (!note.isPinned) e.currentTarget.style.boxShadow = 'var(--shadow-1)'; }}
        onMouseLeave={(e) => { if (!note.isPinned) e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {note.type === 'voice' && (
            <Mic size={16} style={{ color: 'var(--flame)', marginTop: 2, flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                margin: 0,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {note.type === 'text' ? renderContentWithLinks(note.content) : note.content}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
                {formatNoteDisplay(note)}
              </span>
              {note.isPinned && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: 'var(--flame)' }}>
                  <PinIcon size={10} /> Pinned
                </span>
              )}
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                <Circle size={6} fill={note.isSynced ? '#22c55e' : 'var(--flame)'} color={note.isSynced ? '#22c55e' : 'var(--flame)'} />
              </span>
            </div>
          </div>
        </div>
      </div>

      {showContext && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
          onClick={() => setShowContext(false)}
        >
          <div style={{ position: 'absolute', top: contextPos.y, left: contextPos.x, zIndex: 1001 }}>
            <ContextMenu
              note={note}
              onEdit={() => setShowEdit(true)}
              onPlay={() => setShowPlayer(true)}
              onClose={() => setShowContext(false)}
            />
          </div>
        </div>
      )}

      {showEdit && (
        <EditNoteModal note={note} onClose={() => setShowEdit(false)} />
      )}

      {showPlayer && note.type === 'voice' && (
        <VoicePlayerSheet note={note} onClose={() => setShowPlayer(false)} />
      )}
    </>
  );
}
