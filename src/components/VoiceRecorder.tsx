import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Check, Play, Pause } from 'lucide-react';
import { useAudioRecorder } from '../hooks/useAudio';

interface VoiceRecorderProps {
  onSave: (blob: Blob, duration: number) => void;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function VoiceRecorder({ onSave, onClose }: VoiceRecorderProps) {
  const { isRecording, isPaused, duration, waveform, start, stop, pause, resume } = useAudioRecorder();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const previewAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    start();
  }, [start]);

  const handleStop = useCallback(async () => {
    const res = await stop();
    if (res?.blob) {
      const url = URL.createObjectURL(res.blob);
      setPreviewUrl(url);
    }
  }, [stop]);

  const handleConfirm = useCallback(() => {
    if (previewUrl) {
      fetch(previewUrl)
        .then((r) => r.blob())
        .then((blob) => {
          onSave(blob, duration);
        });
    }
  }, [previewUrl, duration, onSave]);

  const togglePreview = useCallback(() => {
    if (!previewAudio.current && previewUrl) {
      const audio = new Audio(previewUrl);
      audio.addEventListener('ended', () => setIsPlayingPreview(false));
      previewAudio.current = audio;
    }
    if (previewAudio.current) {
      if (isPlayingPreview) {
        previewAudio.current.pause();
      } else {
        previewAudio.current.play();
      }
      setIsPlayingPreview(!isPlayingPreview);
    }
  }, [previewUrl, isPlayingPreview]);

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
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
            {previewUrl ? 'Preview recording' : 'Recording...'}
          </span>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 48, color: 'var(--text-primary)' }}>
            {isRecording ? formatTime(duration) : formatTime(duration)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 3, height: 60, marginBottom: 24 }}>
          {waveform.map((val, i) => {
            const barHeight = isRecording ? Math.max(4, Math.min(56, val * 52 + 4)) : 8;
            return (
              <div
                key={i}
                style={{
                  width: 4,
                  height: barHeight,
                  borderRadius: 2,
                  background: isRecording && val > 0.04 ? 'var(--flame)' : 'var(--border)',
                  transition: 'height 40ms ease-out',
                  opacity: isRecording ? 0.9 : 0.4,
                }}
              />
            );
          })}
        </div>

        {!previewUrl ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
            <button
              onClick={isPaused ? resume : pause}
              disabled={!isRecording}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)', opacity: !isRecording ? 0.5 : 1 }}
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button
              onClick={handleStop}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--red)',
                cursor: 'pointer',
                color: '#fff',
                border: 'none',
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 2, background: '#fff' }} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24 }}>
            <button onClick={togglePreview} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: '50%', border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
              {isPlayingPreview ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={handleConfirm}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--flame)',
                cursor: 'pointer',
                color: '#fff',
                border: 'none',
              }}
            >
              <Check size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
