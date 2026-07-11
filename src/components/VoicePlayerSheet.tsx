import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Download } from 'lucide-react';
import { supabase, supabaseConfig } from '../lib/supabase';
import type { Note } from '../types/note';

interface VoicePlayerSheetProps {
  note: Note;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function resolveUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const { data } = await supabase.storage
    .from(supabaseConfig.voiceBucket)
    .createSignedUrl(url, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? null;
}

export function VoicePlayerSheet({ note, onClose }: VoicePlayerSheetProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDurationState] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const playableUrl = await resolveUrl(note.audioUrl);
      if (cancelled || !playableUrl) return;
      setLoading(false);
      const audio = new Audio(playableUrl);
      audio.addEventListener('loadedmetadata', () => setDurationState(audio.duration));
      audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
      audio.addEventListener('ended', () => setIsPlaying(false));
      audioRef.current = audio;
    })();
    return () => {
      cancelled = true;
      audioRef.current?.pause();
    };
  }, [note.audioUrl]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const skipBack = useCallback(() => {
    if (audioRef.current) {
      const newTime = Math.max(0, audioRef.current.currentTime - 3);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      const newTime = audioRef.current.currentTime + 3;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          borderRadius: '32px 32px 0 0',
          padding: '24px 32px 40px',
          width: 'min(100%, 500px)',
          boxShadow: 'var(--shadow-2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Voice note</span>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: 14 }}>Loading audio...</div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, color: 'var(--text-primary)' }}>
                {formatTime(currentTime)}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-secondary)', marginLeft: 8 }}>
                / {formatTime(duration)}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              onChange={seek}
              style={{
                width: '100%',
                height: 4,
                appearance: 'none',
                background: `linear-gradient(to right, var(--flame) ${(currentTime / (duration || 1)) * 100}%, var(--border) ${(currentTime / (duration || 1)) * 100}%)`,
                borderRadius: 2,
                outline: 'none',
                cursor: 'pointer',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, marginTop: 24 }}>
              <button onClick={skipBack} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <SkipBack size={18} />
              </button>
              <button
                onClick={togglePlay}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--flame)',
                  cursor: 'pointer',
                  color: '#fff',
                }}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button onClick={skipForward} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <SkipForward size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <button
                onClick={async () => {
                  const playableUrl = await resolveUrl(note.audioUrl);
                  if (playableUrl) {
                    const a = document.createElement('a');
                    a.href = playableUrl;
                    a.download = `voice-note-${note.id}.webm`;
                    a.click();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 20px',
                  fontSize: 14,
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  background: 'none',
                  cursor: 'pointer',
                }}
              >
                <Download size={16} /> Download
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
