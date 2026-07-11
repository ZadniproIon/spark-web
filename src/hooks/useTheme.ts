import { useCallback, useEffect } from 'react';
import { useStore } from '../lib/store';
import type { ThemePreference } from '../types/note';

export function useTheme() {
  const { state, dispatch } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    const resolved =
      state.theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : state.theme;
    root.setAttribute('data-theme', resolved);
  }, [state.theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (state.theme === 'system') {
        const root = document.documentElement;
        root.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [state.theme]);

  const setTheme = useCallback(
    (theme: ThemePreference) => dispatch({ type: 'SET_THEME', payload: theme }),
    [dispatch]
  );

  return { theme: state.theme, setTheme };
}
