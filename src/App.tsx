import { useEffect, useRef } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { ToastProvider, toast } from './lib/toast';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';

function AuthListener() {
  const { dispatch } = useStore();
  const prevUserRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      dispatch({ type: 'SET_USER', payload: user });
      if (user?.id) {
        prevUserRef.current = user.id;
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      dispatch({ type: 'SET_USER', payload: newUser });
      if (event === 'SIGNED_IN' && newUser?.email && prevUserRef.current !== newUser.id) {
        toast.success(`Signed in as ${newUser.email}`);
        prevUserRef.current = newUser.id;
      } else if (event === 'SIGNED_OUT') {
        prevUserRef.current = null;
      }
    });

    return () => listener?.subscription.unsubscribe();
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
