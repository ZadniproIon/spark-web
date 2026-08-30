import { useCallback } from 'react';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';

export function useAuth() {
  const { state, dispatch } = useStore();

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'SET_USER', payload: null });
    toast.info('Signed out');
  }, [dispatch]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  }, []);

  const updateEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.updateUser({ email });
    if (error) throw error;
  }, []);

  const disconnectGoogleIdentity = useCallback(async () => {
    const user = state.user;
    if (!user) return;
    const googleIdentity = user.identities?.find((id) => id.provider === 'google');
    if (!googleIdentity) throw new Error('No Google identity linked to this account.');
    const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
    if (error) throw error;
    const { data: { user: updatedUser } } = await supabase.auth.getUser();
    dispatch({ type: 'SET_USER', payload: updatedUser });
  }, [state.user, dispatch]);

  const deleteAccount = useCallback(async () => {
    const user = state.user;
    if (!user) return;
    await supabase.from('notes').delete().eq('owner_id', user.id);
    await supabase.auth.signOut();
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'SET_NOTES', payload: [] });
    localStorage.removeItem('spark_notes');
    toast.info('Account and data deleted');
  }, [state.user, dispatch]);

  return {
    user: state.user,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    sendPasswordReset,
    updatePassword,
    updateEmail,
    disconnectGoogleIdentity,
    deleteAccount,
  };
}
