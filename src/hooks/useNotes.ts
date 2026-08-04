import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../lib/store';
import { supabase, supabaseConfig } from '../lib/supabase';
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
    createdAtLocal: (remote.created_at_local as string) ?? null,
    updatedAtLocal: (remote.updated_at_local as string) ?? null,
    isPinned: (remote.is_pinned as boolean) ?? false,
    isTrashed: (remote.is_trashed as boolean) ?? false,
    trashedAt: (remote.trashed_at as string) ?? null,
    isSynced: true,
  };
}

function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}.${ms}`;
}

function parseLocalDate(str: string): Date {
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]));
  return new Date(str);
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
    created_at_local: note.createdAtLocal,
    updated_at_local: note.updatedAtLocal,
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
            const { error: pushErr } = await supabase.from('notes').upsert(noteToRemote(note));
            if (pushErr) {
              console.error('[Spark] Sync push error for', note.id, pushErr);
              continue;
            }
            localById.set(note.id, { ...note, isSynced: true });
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
  }, [state.user, state.notes, dispatch]);

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

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

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
      stopSync();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [state.user?.id, claimLegacyNotes, syncWithRemote, stopSync]);

  const addTextNote = useCallback(async (content: string) => {
    const now = new Date();
    const localStamp = formatDateLocal(now);
    const ownerId = state.user?.id ?? 'guest';
    const note: Note = {
      id: crypto.randomUUID(),
      type: 'text',
      content,
      audioPath: null,
      audioUrl: null,
      createdAt: localStamp,
      updatedAt: localStamp,
      ownerId,
      createdAtLocal: localStamp,
      updatedAtLocal: localStamp,
      isPinned: false,
      isTrashed: false,
      trashedAt: null,
      isSynced: false,
    };
    dispatch({ type: 'ADD_NOTE', payload: note });
    if (state.user) {
      const { error } = await supabase.from('notes').upsert(noteToRemote(note));
      if (error) {
        console.error('Failed to sync note:', error);
      } else {
        dispatch({ type: 'UPDATE_NOTE', payload: { ...note, isSynced: true } });
      }
    }
  }, [state.user, dispatch]);

  const addVoiceNote = useCallback(async (audioBlob: Blob, duration: number) => {
    const now = new Date();
    const localStamp = formatDateLocal(now);
    const noteId = crypto.randomUUID();
    const ownerId = state.user?.id ?? 'guest';
    const note: Note = {
      id: noteId,
      type: 'voice',
      content: `Voice note (${Math.round(duration)}s)`,
      audioPath: null,
      audioUrl: URL.createObjectURL(audioBlob),
      createdAt: localStamp,
      updatedAt: localStamp,
      ownerId,
      createdAtLocal: localStamp,
      updatedAtLocal: localStamp,
      isPinned: false,
      isTrashed: false,
      trashedAt: null,
      isSynced: false,
    };
    dispatch({ type: 'ADD_NOTE', payload: note });

    if (state.user) {
      const filePath = `${state.user.id}/${noteId}.webm`;
      const { error: uploadError } = await supabase.storage
        .from(supabaseConfig.voiceBucket)
        .upload(filePath, audioBlob);
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
        content: `Voice note (${Math.round(duration)}s)`,
        audio_url: audioUrl,
        owner_id: note.ownerId,
        created_at: localStamp,
        updated_at: localStamp,
        is_pinned: false,
        is_trashed: false,
      });
      if (error) {
        console.error('Failed to sync voice note:', error);
      } else {
        dispatch({
          type: 'UPDATE_NOTE',
          payload: { ...note, audioUrl, isSynced: true },
        });
      }
    }
  }, [state.user, dispatch]);

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    const existing = state.notes.find((n) => n.id === id);
    if (!existing) return;
    const now = new Date();
    const localStamp = formatDateLocal(now);
    const updated: Note = { ...existing, ...updates, updatedAt: localStamp, updatedAtLocal: localStamp, isSynced: false };
    dispatch({ type: 'UPDATE_NOTE', payload: updated });
    if (state.user) {
      const { error } = await supabase.from('notes').upsert(noteToRemote(updated));
      if (error) {
        console.error('Failed to sync update:', error);
      } else {
        dispatch({ type: 'UPDATE_NOTE', payload: { ...updated, isSynced: true } });
      }
    }
  }, [state.notes, state.user, dispatch]);

  const togglePin = useCallback(async (id: string) => {
    const note = state.notes.find((n) => n.id === id);
    if (note) await updateNote(id, { isPinned: !note.isPinned });
  }, [state.notes, updateNote]);

  const moveToTrash = useCallback(async (id: string) => {
    await updateNote(id, { isTrashed: true, trashedAt: new Date().toISOString() });
  }, [updateNote]);

  const restoreNote = useCallback(async (id: string) => {
    await updateNote(id, { isTrashed: false, trashedAt: null });
  }, [updateNote]);

  const deleteForever = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE_NOTE', payload: id });
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
      return parseLocalDate(b.updatedAt).getTime() - parseLocalDate(a.updatedAt).getTime();
    });

  const trashedNotes = state.notes
    .filter((n) => n.isTrashed)
    .sort((a, b) => {
      if (!a.trashedAt || !b.trashedAt) return 0;
      return parseLocalDate(b.trashedAt).getTime() - parseLocalDate(a.trashedAt).getTime();
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
