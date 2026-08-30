import { useEffect, useRef } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { ToastProvider, toast } from './lib/toast';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';

function AuthListener() {
  const { dispatch } = useStore();
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    const validateSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (prevUserRef.current) {
          prevUserRef.current = null;
          dispatch({ type: 'SET_USER', payload: null });
        }
        return;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.warn('[Spark] User no longer exists or session invalid. Signing out...');
        await supabase.auth.signOut().catch(() => {});
        prevUserRef.current = null;
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_NOTES', payload: [] });
        localStorage.removeItem('spark_notes');
        return;
      }

      dispatch({ type: 'SET_USER', payload: user });
      if (user.id) {
        prevUserRef.current = user.id;
      }
    };

    validateSession();

    const handleFocus = () => {
      validateSession();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        validateSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        prevUserRef.current = null;
        dispatch({ type: 'SET_USER', payload: null });
        return;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        await supabase.auth.signOut().catch(() => {});
        prevUserRef.current = null;
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_NOTES', payload: [] });
        localStorage.removeItem('spark_notes');
        return;
      }

      dispatch({ type: 'SET_USER', payload: user });
      if (event === 'SIGNED_IN' && user?.email && prevUserRef.current !== user.id) {
        toast.success(`Signed in as ${user.email}`);
        prevUserRef.current = user.id;
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      listener?.subscription.unsubscribe();
    };
  }, [dispatch]);

  return null;
}

function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <AuthListener />
        <Layout />
      </ToastProvider>
    </StoreProvider>
  );
}

export default App;
