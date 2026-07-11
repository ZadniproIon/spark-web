import { useCallback } from 'react';
import { Pin, PinOff, Edit3, Copy, Download, Play, Trash2, Link2 } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import type { Note } from '../../types/note';

interface ContextMenuProps {
  note: Note;
  onEdit?: () => void;
  onPlay?: () => void;
  onClose: () => void;
}

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+/g;
  return text.match(urlRegex) ?? [];
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '10px 16px',
        fontSize: 14,
        color: destructive ? 'var(--red)' : 'var(--text-primary)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 140ms ease-out',
        borderRadius: 8,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <span style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
      {label}
    </button>
  );
}

export function ContextMenu({ note, onEdit, onPlay, onClose }: ContextMenuProps) {
  const { togglePin, moveToTrash } = useNotes();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(note.content);
    onClose();
  }, [note.content, onClose]);

  const handlePin = useCallback(() => {
    togglePin(note.id);
    onClose();
  }, [note.id, togglePin, onClose]);

  const handleTrash = useCallback(() => {
    moveToTrash(note.id);
    onClose();
  }, [note.id, moveToTrash, onClose]);

  const handleDownload = useCallback(() => {
    if (note.audioUrl) {
      const a = document.createElement('a');
      a.href = note.audioUrl;
      a.download = `voice-note-${note.id}.webm`;
      a.click();
    }
    onClose();
  }, [note.audioUrl, note.id, onClose]);

  const urls = extractUrls(note.content);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-2)',
        padding: 6,
        minWidth: 200,
      }}
    >
      <MenuItem icon={note.isPinned ? <PinOff size={16} /> : <Pin size={16} />} label={note.isPinned ? 'Unpin' : 'Pin'} onClick={handlePin} />
      {note.type === 'text' && onEdit && <MenuItem icon={<Edit3 size={16} />} label="Edit" onClick={() => { onEdit(); onClose(); }} />}
      {note.type === 'voice' && onPlay && <MenuItem icon={<Play size={16} />} label="Play" onClick={() => { onPlay(); onClose(); }} />}
      <MenuItem icon={<Copy size={16} />} label="Copy" onClick={handleCopy} />
      {note.type === 'voice' && note.audioUrl && (
        <MenuItem icon={<Download size={16} />} label="Save to Downloads" onClick={handleDownload} />
      )}
      {urls.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0', paddingTop: 4 }}>
          <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>LINKS</div>
          {urls.map((url, i) => (
            <MenuItem
              key={i}
              icon={<Link2 size={16} />}
              label={url.length > 30 ? url.slice(0, 30) + '...' : url}
              onClick={() => { window.open(url.startsWith('http') ? url : 'https://' + url, '_blank'); onClose(); }}
            />
          ))}
        </div>
      )}
      <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0', paddingTop: 4 }}>
        <MenuItem icon={<Trash2 size={16} />} label="Move to trash" destructive onClick={handleTrash} />
      </div>
    </div>
  );
}
