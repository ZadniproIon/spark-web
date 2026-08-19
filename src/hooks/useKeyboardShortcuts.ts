import { useEffect } from 'react';
import { useStore } from '../lib/store';

interface KeyboardShortcutsOptions {
  onOpenNewNote?: () => void;
  onToggleSearch?: () => void;
  onCloseSearch?: () => void;
}

export function useKeyboardShortcuts(options?: KeyboardShortcutsOptions) {
  const { state, dispatch } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl as HTMLElement)?.isContentEditable;

      // 1. ESCAPE: Close search and clear query when no modal is open
      if (e.key === 'Escape') {
        if (!state.modal) {
          options?.onCloseSearch?.();
          if (state.searchQuery) {
            e.preventDefault();
            dispatch({ type: 'SET_SEARCH', payload: '' });
          }
        }
        return;
      }

      // 2. Ctrl+K or Cmd+K: Toggle search (open if closed, close if open)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        options?.onToggleSearch?.();
        return;
      }

      // 3. "/" key when not in an input: Toggle search
      if (e.key === '/' && !isInput && !state.modal) {
        e.preventDefault();
        options?.onToggleSearch?.();
        return;
      }

      // 4. "N" or "n" when not typing in an input: Open new note
      if (e.key.toLowerCase() === 'n' && !isInput && !state.modal && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (options?.onOpenNewNote) {
          options.onOpenNewNote();
        } else {
          dispatch({ type: 'OPEN_MODAL', payload: { modal: 'addNote' } });
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.modal, state.searchQuery, dispatch, options]);
}
