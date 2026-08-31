import { useEffect, useRef } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { ToastProvider, toast } from './lib/toast';
import { supabase } from './lib/supabase';
import { isFatalAuthError } from './lib/authHelpers';
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

      // Immediately set user from active local session
      if (session.user) {
        dispatch({ type: 'SET_USER', payload: session.user });
        prevUserRef.current = session.user.id;
      }

      // If online, check against auth server to catch deleted accounts
      if (navigator.onLine) {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          if (isFatalAuthError(error)) {
            console.warn('[Spark] User account no longer exists or session revoked. Signing out...');
            await supabase.auth.signOut().catch(() => {});
            prevUserRef.current = null;
            dispatch({ type: 'SET_USER', payload: null });
            dispatch({ type: 'SET_NOTES', payload: [] });
            localStorage.removeItem('spark_notes');
          } else {
            console.warn('[Spark] Network drop during session check, maintaining local session:', error.message);
          }
          return;
        }

        if (user) {
          dispatch({ type: 'SET_USER', payload: user });
          prevUserRef.current = user.id;
        }
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

      const currentUser = session.user;
      if (currentUser) {
        dispatch({ type: 'SET_USER', payload: currentUser });
        if (event === 'SIGNED_IN' && currentUser.email && prevUserRef.current !== currentUser.id) {
          toast.success(`Signed in as ${currentUser.email}`);
          prevUserRef.current = currentUser.id;
        }
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
