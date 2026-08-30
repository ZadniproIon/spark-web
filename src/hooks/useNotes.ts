import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../lib/store';
import { toast } from '../lib/toast';
import { supabase, supabaseConfig } from '../lib/supabase';
import { saveOfflineAudio, getOfflineAudio, deleteOfflineAudio } from '../lib/offlineAudio';
import type { Note } from '../types/note';

function noteFromRemote(remote: Record<string, unknown>): Note {
  return {
    id: remote.id as string,
    type: (remote.type as Note['type']) ?? 'text',
    content: (remote.content as string) ?? '',
    audioPath: null,
    audioUrl: (remote.audio_url as string) ?? null,
    createdAt: (remote.created_at as string) ?? new Date().toISOString(),
    updatedAt: (remote.updated_at as string) ?? new Date().toISOString(),
    ownerId: (remote.owner_id as string) ?? '',
    isPinned: (remote.is_pinned as boolean) ?? false,
    isTrashed: (remote.is_trashed as boolean) ?? false,
    trashedAt: (remote.trashed_at as string) ?? null,
    isSynced: true,
  };
}

function noteToRemote(note: Note): Record<string, unknown> {
  return {
    id: note.id,
    type: note.type,
    content: note.content,
    audio_url: note.audioUrl,
    owner_id: note.ownerId,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    is_pinned: note.isPinned,
    is_trashed: note.isTrashed,
    trashed_at: note.trashedAt,
  };
}

export function useNotes() {
  const { state, dispatch } = useStore();
  const syncTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSyncing = useRef(false);
  const notesRef = useRef(state.notes);
  notesRef.current = state.notes;

  const stopSync = useCallback(() => {
    if (syncTimer.current) {
      clearInterval(syncTimer.current);
      syncTimer.current = null;
    }
  }, []);

  const syncWithRemote = useCallback(async () => {
    const user = state.user;
    if (!user || isSyncing.current) return;
    isSyncing.current = true;

    try {
      const { data: remoteNotes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('[Spark] Sync fetch error:', error);
        return;
      }

      const localNotes = notesRef.current;
      const localById = new Map(localNotes.map((n) => [n.id, n]));
      let changed = false;

      const remoteItems = (remoteNotes ?? []).map(noteFromRemote);

      for (const remote of remoteItems) {
        const local = localById.get(remote.id);
        if (!local) {
          localById.set(remote.id, remote);
          changed = true;
        } else if (new Date(remote.updatedAt) > new Date(local.updatedAt)) {
          localById.set(remote.id, remote);
          changed = true;
        } else if (new Date(local.updatedAt) > new Date(remote.updatedAt)) {
          const { error: pushErr } = await supabase.from('notes').upsert(noteToRemote(local));
          if (pushErr) console.error('[Spark] Sync push error:', pushErr);
        } else if (!local.isSynced) {
          localById.set(remote.id, { ...local, isSynced: true });
          changed = true;
        } else if (local.isTrashed !== remote.isTrashed || local.trashedAt !== remote.trashedAt || local.isPinned !== remote.isPinned) {
          localById.set(remote.id, remote);
          changed = true;
        }
      }

      const remoteIds = new Set(remoteItems.map((n) => n.id));
      for (const note of localNotes) {
        if (!remoteIds.has(note.id) && note.ownerId === user.id) {
          if (!note.isSynced) {
            let noteToSync = note;
            if (note.type === 'voice' && (!note.audioUrl || note.audioUrl.startsWith('blob:'))) {
              const offlineBlob = await getOfflineAudio(note.id);
              if (offlineBlob) {
                const isWav = offlineBlob.type.includes('wav');
                const isMp4 = offlineBlob.type.includes('mp4') || offlineBlob.type.includes('m4a');
                const ext = isWav ? 'wav' : isMp4 ? 'm4a' : 'webm';
                const filePath = `${user.id}/${note.id}.${ext}`;
                const { error: uploadError } = await supabase.storage
                  .from(supabaseConfig.voiceBucket)
                  .upload(filePath, offlineBlob, { contentType: offlineBlob.type || 'audio/wav', upsert: true });
                if (!uploadError) {
                  const { data: urlData } = await supabase.storage
                    .from(supabaseConfig.voiceBucket)
                    .createSignedUrl(filePath, 60 * 60 * 24 * 365);
                  noteToSync = { ...note, audioUrl: urlData?.signedUrl ?? null };
                  deleteOfflineAudio(note.id);
                }
              }
            }

            const { error: pushErr } = await supabase.from('notes').upsert(noteToRemote(noteToSync));
            if (pushErr) {
              console.error('[Spark] Sync push error for', note.id, pushErr);
              continue;
            }
            localById.set(note.id, { ...noteToSync, isSynced: true });
            changed = true;
          } else {
            localById.delete(note.id);
            changed = true;
          }
        }
      }

      if (changed) {
        dispatch({ type: 'SET_NOTES', payload: Array.from(localById.values()) });
      }
    } catch (err) {
      console.error('[Spark] Sync failed:', err);
    } finally {
      isSyncing.current = false;
    }
  }, [state.user, dispatch]);

  const claimLegacyNotes = useCallback(async (userId: string) => {
    const updated: Note[] = [];
    for (const note of state.notes) {
      if (note.ownerId === '' || note.ownerId === 'guest' || note.ownerId === 'guest-local') {
        const claimed = { ...note, ownerId: userId, isSynced: false };
        updated.push(claimed);
        if (userId !== 'guest') {
          const { error } = await supabase.from('notes').upsert(noteToRemote(claimed));
          if (error) {
            console.error('Failed to claim note:', error);
          }
        }
      }
    }
    if (updated.length > 0) {
      const merged = state.notes.map((n) => {
        const found = updated.find((u) => u.id === n.id);
        return found ?? n;
      });
      dispatch({ type: 'SET_NOTES', payload: merged });
    }
  }, [state.notes, dispatch]);

  const purgeExpiredTrashedNotes = useCallback(async () => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const expiredNotes = notesRef.current.filter(
      (n) => n.isTrashed && n.trashedAt && new Date(n.trashedAt).getTime() < thirtyDaysAgo
    );
    if (expiredNotes.length === 0) return;

    for (const note of expiredNotes) {
      dispatch({ type: 'DELETE_NOTE', payload: note.id });
      if (state.user && note.ownerId === state.user.id) {
        await supabase.from('notes').delete().eq('id', note.id).eq('owner_id', state.user.id);
      }
    }
  }, [state.user, dispatch]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    purgeExpiredTrashedNotes();

    const handleOnline = () => {
      syncWithRemote();
      purgeExpiredTrashedNotes();
    };

    window.addEventListener('online', handleOnline);

    if (state.user) {
      claimLegacyNotes(state.user.id);
      syncWithRemote();
      stopSync();

      // Realtime subscription for instant updates
      channel = supabase
        .channel(`notes-realtime-${crypto.randomUUID()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notes',
            filter: `owner_id=eq.${state.user.id}`,
          },
          () => {
            syncWithRemote();
          }
        )
        .subscribe();

      // Fallback polling (increased interval since realtime is active)
      syncTimer.current = setInterval(() => {
        syncWithRemote();
      }, 30000);
    } else {
      stopSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      stopSync();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [state.user?.id, claimLegacyNotes, syncWithRemote, purgeExpiredTrashedNotes, stopSync]);

  const addTextNote = useCallback(async (content: string) => {
    const now = new Date();
    const isoNow = now.toISOString();
    const ownerId = state.user?.id ?? 'guest';
    const note: Note = {
      id: crypto.randomUUID(),
      type: 'text',
      content,
      audioPath: null,
      audioUrl: null,
      createdAt: isoNow,
      updatedAt: isoNow,
      ownerId,
      isPinned: false,
      isTrashed: false,
      trashedAt: null,
      isSynced: false,
    };
    dispatch({ type: 'ADD_NOTE', payload: note });
    toast.success('Note created');
    if (state.user) {
      const { error } = await supabase.from('notes').upsert(noteToRemote(note));
      if (error) {
        console.error('Failed to sync note:', error);
      } else {
        dispatch({ type: 'UPDATE_NOTE', payload: { ...note, isSynced: true } });
      }
    }
  }, [state.user, dispatch]);

  const addVoiceNote = useCallback(
    async (audioBlob: Blob, duration: number, customTitle?: string) => {
      const now = new Date();
      const isoNow = now.toISOString();
      const noteId = crypto.randomUUID();
      const ownerId = state.user?.id ?? 'guest';
      const defaultTitle = `Voice note (${Math.max(1, Math.round(duration))}s)`;
      const content = customTitle?.trim() ? customTitle.trim() : defaultTitle;
      const note: Note = {
        id: noteId,
        type: 'voice',
        content,
        audioPath: null,
        audioUrl: URL.createObjectURL(audioBlob),
        createdAt: isoNow,
        updatedAt: isoNow,
        ownerId,
        isPinned: false,
        isTrashed: false,
        trashedAt: null,
        isSynced: false,
      };
      saveOfflineAudio(noteId, audioBlob);
      dispatch({ type: 'ADD_NOTE', payload: note });
      toast.success('Voice note saved');

      if (state.user) {
        const isWav = audioBlob.type.includes('wav');
        const isMp4 = audioBlob.type.includes('mp4') || audioBlob.type.includes('m4a') || audioBlob.type.includes('aac');
        const ext = isWav ? 'wav' : isMp4 ? 'm4a' : 'webm';
        const filePath = `${state.user.id}/${noteId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(supabaseConfig.voiceBucket)
          .upload(filePath, audioBlob, { contentType: audioBlob.type || (isWav ? 'audio/wav' : isMp4 ? 'audio/mp4' : 'audio/webm'), upsert: true });
        if (uploadError) {
          console.error('Failed to upload voice audio:', uploadError);
          return;
        }
        const { data: urlData } = await supabase.storage
          .from(supabaseConfig.voiceBucket)
          .createSignedUrl(filePath, 60 * 60 * 24 * 365);
        const audioUrl = urlData?.signedUrl ?? null;

        const { error } = await supabase.from('notes').upsert({
          id: noteId,
          type: 'voice',
          content,
          audio_url: audioUrl,
          owner_id: note.ownerId,
          created_at: isoNow,
          updated_at: isoNow,
          is_pinned: false,
          is_trashed: false,
        });
        if (error) {
          console.error('Failed to sync voice note:', error);
        } else {
          deleteOfflineAudio(noteId);
          dispatch({
            type: 'UPDATE_NOTE',
            payload: { ...note, audioUrl, isSynced: true },
          });
        }
      }
    },
    [state.user, dispatch]
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<Note>, touchUpdatedAt = true) => {
      const existing = state.notes.find((n) => n.id === id);
      if (!existing) return;
      const now = new Date();
      const isoNow = now.toISOString();
      const updated: Note = {
        ...existing,
        ...updates,
        updatedAt: touchUpdatedAt ? (updates.updatedAt ?? isoNow) : existing.updatedAt,
        isSynced: false,
      };
      dispatch({ type: 'UPDATE_NOTE', payload: updated });
      if (state.user) {
        const { error } = await supabase.from('notes').upsert(noteToRemote(updated));
        if (error) {
          console.error('Failed to sync update:', error);
        } else {
          dispatch({ type: 'UPDATE_NOTE', payload: { ...updated, isSynced: true } });
        }
      }
    },
    [state.notes, state.user, dispatch]
  );

  const togglePin = useCallback(
    async (id: string) => {
      const note = state.notes.find((n) => n.id === id);
      if (note) {
        const newPinned = !note.isPinned;
        await updateNote(id, { isPinned: newPinned }, false);
        toast.info(newPinned ? 'Note pinned' : 'Note unpinned');
      }
    },
    [state.notes, updateNote]
  );

  const moveToTrash = useCallback(
    async (id: string) => {
      await updateNote(id, { isTrashed: true, isPinned: false, trashedAt: new Date().toISOString() }, false);
      toast.info('Note moved to recycle bin');
    },
    [updateNote]
  );

  const restoreNote = useCallback(
    async (id: string) => {
      await updateNote(id, { isTrashed: false, trashedAt: null }, false);
      toast.success('Note restored');
    },
    [updateNote]
  );

  const deleteForever = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: id });
    toast.info('Note permanently deleted');
    if (state.user) {
      const { error } = await supabase.from('notes').delete().eq('id', id).eq('owner_id', state.user.id);
      if (error) {
        console.error('Failed to delete remote note:', error);
      }
    }
  }, [state.user, dispatch]);

  const searchNotes = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH', payload: query });
  }, [dispatch]);

  const activeNotes = state.notes
    .filter((n) => !n.isTrashed)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const trashedNotes = state.notes
    .filter((n) => n.isTrashed)
    .sort((a, b) => {
      if (!a.trashedAt || !b.trashedAt) return 0;
      return new Date(b.trashedAt).getTime() - new Date(a.trashedAt).getTime();
    });

  const filteredNotes = state.searchQuery
    ? activeNotes.filter((n) =>
        n.content.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    : activeNotes;

  return {
    notes: filteredNotes,
    activeNotes,
    trashedNotes,
    addTextNote,
    addVoiceNote,
    updateNote,
    togglePin,
    moveToTrash,
    restoreNote,
    deleteForever,
    searchNotes,
    searchQuery: state.searchQuery,
    syncWithRemote,
  };
}
