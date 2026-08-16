import { useState, useCallback } from 'react';
import { Mic, Pin as PinIcon } from 'lucide-react';
import { ContextMenu } from './ui/ContextMenu';
import { VoicePlayerSheet } from './VoicePlayerSheet';
import { EditNoteModal } from './EditNoteModal';
import type { Note } from '../types/note';

function formatNoteDisplay(note: Note): string {
  const raw = note.updatedAt || note.createdAt;
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} - ${hours}:${minutes}`;
}
function renderContentWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  return text.split(urlRegex).map((part, i) => urlRegex.test(part)
    ? <a key={i} href={part.startsWith('http') ? part : `https://${part}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{part}</a>
    : <span key={i}>{part}</span>);
}
export function NoteCard({ note }: { note: Note }) {
  const [showContext, setShowContext] = useState(false);
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 });
  const [showEdit, setShowEdit] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const handleContextMenu = useCallback((e: React.MouseEvent) => { e.preventDefault(); setContextPos({ x: e.clientX, y: e.clientY }); setShowContext(true); }, []);
  return <>
    <article className={`note-card ${note.isPinned ? 'note-card--pinned' : ''}`} onContextMenu={handleContextMenu}>
      <p className="note-card__content">{note.type === 'voice' ? <><Mic size={16} aria-hidden="true" /> {note.content}</> : renderContentWithLinks(note.content)}</p>
      <footer className="note-card__meta"><time>{formatNoteDisplay(note)}</time>{note.isPinned && <span><PinIcon size={11} aria-hidden="true" /> Pinned</span>}</footer>
    </article>
    {showContext && <div className="note-card__context-layer" onClick={() => setShowContext(false)}><div style={{ position: 'absolute', top: contextPos.y, left: contextPos.x }} onClick={(e) => e.stopPropagation()}><ContextMenu note={note} onEdit={() => setShowEdit(true)} onPlay={() => setShowPlayer(true)} onClose={() => setShowContext(false)} /></div></div>}
    {showEdit && <EditNoteModal note={note} onClose={() => setShowEdit(false)} />}
    {showPlayer && note.type === 'voice' && <VoicePlayerSheet note={note} onClose={() => setShowPlayer(false)} />}
  </>;
}
