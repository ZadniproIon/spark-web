import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Download } from 'lucide-react';
import { supabase, supabaseConfig } from '../lib/supabase';
import type { Note } from '../types/note';

interface VoicePlayerSheetProps {
  note: Note;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function resolveUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  const { data } = await supabase.storage
    .from(supabaseConfig.voiceBucket)
    .createSignedUrl(url, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? null;
}

export function VoicePlayerSheet({ note, onClose }: VoicePlayerSheetProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const isSeekingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;

  const stopTimer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  const updateProgress = useCallback(() => {
    if (audioCtxRef.current && isPlayingRef.current && audioBufferRef.current && !isSeekingRef.current) {
      const elapsed = audioCtxRef.current.currentTime - startTimeRef.current + offsetRef.current;
      const totalDur = audioBufferRef.current.duration;
      if (elapsed >= totalDur) {
        setCurrentTime(totalDur);
        setIsPlaying(false);
        offsetRef.current = 0;
        stopTimer();
        return;
      }
      setCurrentTime(elapsed);
      animFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [stopTimer]);

  const stopSourceNode = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.onended = null;
        sourceNodeRef.current.stop(0);
        sourceNodeRef.current.disconnect();
      } catch (_) {}
      sourceNodeRef.current = null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const playableUrl = await resolveUrl(note.audioUrl);
      if (cancelled || !playableUrl) return;

      try {
        const res = await fetch(playableUrl);
        const arrayBuffer = await res.arrayBuffer();
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const decoded = await ctx.decodeAudioData(arrayBuffer);
        if (cancelled) return;

        audioBufferRef.current = decoded;
        setDuration(decoded.duration);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load audio for playback:', err);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      stopTimer();
      stopSourceNode();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [note.audioUrl, stopTimer, stopSourceNode]);

  const playFrom = useCallback((targetOffset: number) => {
    const ctx = audioCtxRef.current;
    const buffer = audioBufferRef.current;
    if (!ctx || !buffer) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    stopSourceNode();

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const clampedOffset = Math.max(0, Math.min(buffer.duration - 0.05, targetOffset));
    offsetRef.current = clampedOffset;
    startTimeRef.current = ctx.currentTime;

    source.onended = () => {
      if (isPlayingRef.current && !isSeekingRef.current) {
        const elapsed = ctx.currentTime - startTimeRef.current + offsetRef.current;
        if (elapsed >= buffer.duration - 0.1) {
          setIsPlaying(false);
          setCurrentTime(0);
          offsetRef.current = 0;
          stopTimer();
        }
      }
    };

    source.start(0, clampedOffset);
    sourceNodeRef.current = source;
    setIsPlaying(true);
    stopTimer();
    animFrameRef.current = requestAnimationFrame(updateProgress);
  }, [stopSourceNode, stopTimer, updateProgress]);

  const pauseAudio = useCallback(() => {
    if (audioCtxRef.current && isPlaying) {
      const elapsed = audioCtxRef.current.currentTime - startTimeRef.current + offsetRef.current;
      offsetRef.current = Math.max(0, Math.min(duration, elapsed));
      setCurrentTime(offsetRef.current);
    }
    stopSourceNode();
    stopTimer();
    setIsPlaying(false);
  }, [isPlaying, duration, stopSourceNode, stopTimer]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseAudio();
    } else {
      if (currentTime >= duration - 0.1) {
        playFrom(0);
      } else {
        playFrom(offsetRef.current);
      }
    }
  }, [isPlaying, pauseAudio, playFrom, currentTime, duration]);

  const handleSeekChange = useCallback((targetTime: number) => {
    const clamped = Math.max(0, Math.min(duration, targetTime));
    setCurrentTime(clamped);
    offsetRef.current = clamped;
  }, [duration]);

  const handleSeekStart = useCallback(() => {
    isSeekingRef.current = true;
    stopTimer();
  }, [stopTimer]);

  const handleSeekEnd = useCallback((targetTime: number) => {
    isSeekingRef.current = false;
    const clamped = Math.max(0, Math.min(duration, targetTime));
    offsetRef.current = clamped;
    setCurrentTime(clamped);
    if (isPlayingRef.current) {
      playFrom(clamped);
    }
  }, [duration, playFrom]);

  const skipBack = useCallback(() => {
    const newTime = Math.max(0, currentTime - 3);
    handleSeekEnd(newTime);
  }, [handleSeekEnd, currentTime]);

  const skipForward = useCallback(() => {
    const newTime = Math.min(duration, currentTime + 3);
    handleSeekEnd(newTime);
  }, [handleSeekEnd, currentTime, duration]);

  const sliderPercent = duration > 0
    ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
    : 0;

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
              max={duration || 1}
              step={0.01}
              value={currentTime}
              onPointerDown={handleSeekStart}
              onMouseDown={handleSeekStart}
              onTouchStart={handleSeekStart}
              onChange={(e) => handleSeekChange(Number(e.target.value))}
              onPointerUp={(e) => handleSeekEnd(Number((e.target as HTMLInputElement).value))}
              onMouseUp={(e) => handleSeekEnd(Number((e.target as HTMLInputElement).value))}
              onTouchEnd={(e) => handleSeekEnd(Number((e.target as HTMLInputElement).value))}
              style={{
                width: '100%',
                height: 4,
                appearance: 'none',
                background: `linear-gradient(to right, var(--flame) ${sliderPercent}%, var(--border) ${sliderPercent}%)`,
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
