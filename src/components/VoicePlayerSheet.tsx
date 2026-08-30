import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Download, Loader2 } from 'lucide-react';
import { useModalAnimation } from '../hooks/useModalAnimation';
import { downloadVoiceNoteAudio, resolveVoiceUrl } from '../lib/audioDownload';
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

export function VoicePlayerSheet({ note, onClose }: VoicePlayerSheetProps) {
  const { isClosing, handleClose } = useModalAnimation(onClose);
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
      const playableUrl = await resolveVoiceUrl(note.audioUrl);
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
      className={`modal-overlay ${isClosing ? 'modal-overlay--closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className="modal-content-animated"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--bg)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
          border: '1px solid var(--border)',
          transition: 'all 200ms ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            Voice Note
          </span>
          <button
            onClick={handleClose}
            type="button"
            title="Close"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 150ms ease, color 150ms ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {note.content && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '14px 16px',
              fontSize: '15px',
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              fontFamily: 'DM Sans, var(--font-sans)',
              wordBreak: 'break-word',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          >
            {note.content}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 0', gap: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Loading audio...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 4px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 500, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(currentTime)}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text-secondary)', marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
                / {formatTime(duration)}
              </span>
            </div>

            <div style={{ position: 'relative', width: '100%', padding: '6px 0' }}>
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
                  height: 6,
                  appearance: 'none',
                  background: `linear-gradient(to right, var(--flame) ${sliderPercent}%, var(--border) ${sliderPercent}%)`,
                  borderRadius: 3,
                  outline: 'none',
                  cursor: 'pointer',
                  margin: 0,
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, margin: '4px 0' }}>
              <button
                onClick={skipBack}
                type="button"
                title="Rewind 3 seconds"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'background-color 150ms ease, transform 100ms ease',
                }}
              >
                <SkipBack size={18} />
              </button>
              <button
                onClick={togglePlay}
                type="button"
                title={isPlaying ? 'Pause' : 'Play'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'var(--flame)',
                  cursor: 'pointer',
                  color: '#fff',
                  boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)',
                  transition: 'transform 100ms ease',
                }}
              >
                {isPlaying ? <Pause size={26} /> : <Play size={26} style={{ marginLeft: 2 }} />}
              </button>
              <button
                onClick={skipForward}
                type="button"
                title="Forward 3 seconds"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'background-color 150ms ease, transform 100ms ease',
                }}
              >
                <SkipForward size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
              <button
                onClick={() => downloadVoiceNoteAudio(note)}
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 22px',
                  fontSize: 14,
                  fontFamily: 'Inter, var(--font-sans)',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease, border-color 150ms ease',
                }}
              >
                <Download size={16} /> Save to Downloads
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
