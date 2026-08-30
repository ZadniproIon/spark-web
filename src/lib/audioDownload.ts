import { supabase, supabaseConfig } from './supabase';
import { getOfflineAudio } from './offlineAudio';
import { toast } from './toast';
import type { Note } from '../types/note';

export async function resolveVoiceUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  const { data } = await supabase.storage
    .from(supabaseConfig.voiceBucket)
    .createSignedUrl(url, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? null;
}

export async function downloadVoiceNoteAudio(note: Note): Promise<void> {
  try {
    let blob: Blob | null = null;

    // Check IndexedDB first for offline or freshly recorded audio
    const offlineBlob = await getOfflineAudio(note.id);
    if (offlineBlob) {
      blob = offlineBlob;
    } else if (note.audioUrl) {
      const playableUrl = await resolveVoiceUrl(note.audioUrl);
      if (playableUrl) {
        const res = await fetch(playableUrl);
        blob = await res.blob();
      }
    }

    if (!blob || blob.size === 0) {
      toast.error('Unable to download audio: file not available');
      return;
    }

    const blobUrl = URL.createObjectURL(blob);
    let ext = 'webm';
    if (blob.type.includes('wav')) ext = 'wav';
    else if (blob.type.includes('mp4') || blob.type.includes('m4a') || blob.type.includes('aac')) ext = 'm4a';
    else if (blob.type.includes('ogg')) ext = 'ogg';

    const safeTitle = note.content
      ? note.content.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 32)
      : '';
    const filename = safeTitle ? `${safeTitle}.${ext}` : `voice-note-${note.id.slice(0, 8)}.${ext}`;

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    toast.success('Audio downloaded');
  } catch (err) {
    console.error('Download audio failed:', err);
    toast.error('Failed to download audio file');
  }
}
