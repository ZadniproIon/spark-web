import { useCallback } from 'react';
import { useStore } from '../lib/store';
import { supabase, supabaseConfig } from '../lib/supabase';
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

    // 1. Delete user notes from public.notes
    const { error: notesError } = await supabase.from('notes').delete().eq('owner_id', user.id);
    if (notesError) {
      console.warn('Failed to delete user notes:', notesError);
    }

    // 2. Remove audio files in user folder from voice storage bucket
    try {
      const { data: files } = await supabase.storage.from(supabaseConfig.voiceBucket).list(user.id);
      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${user.id}/${f.name}`);
        await supabase.storage.from(supabaseConfig.voiceBucket).remove(filePaths);
      }
    } catch (e) {
      console.warn('Storage cleanup during account deletion failed:', e);
    }

    // 3. Delete user from auth.users via RPC
    const { error: rpcError } = await supabase.rpc('delete_user');
    if (rpcError) {
      console.error('Failed to delete account from auth.users:', rpcError);
      throw new Error(rpcError.message || 'Failed to permanently delete user account');
    }

    // 4. Sign out and clear all local state
    await supabase.auth.signOut().catch(() => {});
    dispatch({ type: 'SET_USER', payload: null });
    dispatch({ type: 'SET_NOTES', payload: [] });
    localStorage.removeItem('spark_notes');
    toast.info('Account and all data permanently deleted');
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
