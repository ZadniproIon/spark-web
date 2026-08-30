import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase } from './lib/supabase';
import './index.css';
import App from './App';

async function initApp() {
  const hash = window.location.hash;
  console.log('[Spark] initApp - hash:', hash ? hash.substring(0, 80) + '...' : 'none');

  if (hash && hash.includes('access_token')) {
    const hashStr = hash.replace('#', '');
    const params = new URLSearchParams(hashStr);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    console.log('[Spark] Tokens found:', { hasAccess: !!accessToken, hasRefresh: !!refreshToken });

    if (accessToken && refreshToken) {
      try {
        // Try setSession first (handles validation + storage)
        const result = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (result.error) {
          console.error('[Spark] setSession failed:', result.error);
        } else {
          console.log('[Spark] Session set! User:', result.data.session?.user?.email);
        }
      } catch (err) {
        console.error('[Spark] setSession threw:', err);
      }
    }
    window.history.replaceState(null, '', window.location.pathname);
  } else {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.warn('[Spark] Stale or deleted session found on startup, purging...');
        await supabase.auth.signOut().catch(() => {});
        localStorage.removeItem('spark_notes');
      } else {
        console.log('[Spark] Verified active session:', user.email);
      }
    }
  }

  const rootElement = document.getElementById('root')!;
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

initApp();
