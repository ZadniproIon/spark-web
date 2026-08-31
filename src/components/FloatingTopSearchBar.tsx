import { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useStore } from '../lib/store';

interface FloatingTopSearchBarProps {
  onClose?: () => void;
  resultCount?: number;
}

export function FloatingTopSearchBar({ onClose, resultCount }: FloatingTopSearchBarProps) {
  const { state, dispatch } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    dispatch({ type: 'SET_SEARCH', payload: '' });
    onClose?.();
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        marginBottom: '20px',
        animation: 'modalSlideUp 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: 'min(100%, 460px)',
          padding: '10px 14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--flame)',
          borderRadius: 'var(--radius-search)',
          boxShadow: '0 8px 24px var(--flame-subtle)',
        }}
      >
        <Search size={18} color="var(--flame)" style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search notes..."
          value={state.searchQuery}
          onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              handleClear();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
              e.preventDefault();
              handleClear();
            }
          }}
          autoFocus
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 14,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
          }}
        />

        {state.searchQuery && resultCount !== undefined && (
          <span
            style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              padding: '2px 7px',
              borderRadius: 'var(--radius-button)',
              background: 'var(--flame-subtle)',
              color: 'var(--flame)',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {resultCount} {resultCount === 1 ? 'note' : 'notes'}
          </span>
        )}

        <button
          type="button"
          onClick={handleClear}
          title="Clear search (Esc)"
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 180ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
