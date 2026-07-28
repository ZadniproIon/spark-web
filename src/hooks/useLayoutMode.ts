import { useCallback } from 'react';
import { useStore } from '../lib/store';
import type { LayoutMode } from '../types/note';

export function useLayoutMode() {
  const { state, dispatch } = useStore();

  const setLayoutMode = useCallback(
    (mode: LayoutMode) => {
      dispatch({ type: 'SET_LAYOUT_MODE', payload: mode });
    },
    [dispatch]
  );

  return {
    layoutMode: state.layoutMode,
    setLayoutMode,
  };
}
