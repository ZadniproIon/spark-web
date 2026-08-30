import { useState, useCallback, useEffect } from 'react';
import { Mic, X, Check, Play, Pause } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { useAudioRecorder } from '../hooks/useAudio';
import { useModalAnimation } from '../hooks/useModalAnimation';

interface AddNoteModalProps {
  onClose: () => void;
  initialMode?: 'text' | 'voice';
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function AddNoteModal({ onClose, initialMode = 'text' }: AddNoteModalProps) {
  const [mode, setMode] = useState<'text' | 'voice'>(initialMode);
  const [content, setContent] = useState('');
  const [isSavingVoice, setIsSavingVoice] = useState(false);
  const { addTextNote, addVoiceNote } = useNotes();
  
  const handleModalClose = useCallback(() => {
    if (mode === 'voice') {
      // cancelRecording(); // will be called later if needed
    }
    onClose();
  }, [mode, onClose]);

  const { isClosing, handleClose } = useModalAnimation(handleModalClose);

  const {
    isRecording,
    isPaused,
    duration,
    waveform,
    start: startRecording,
    stop: stopRecording,
    pause: pauseRecording,
    resume: resumeRecording,
    cancel: cancelRecording,
  } = useAudioRecorder();

  useEffect(() => {
    if (initialMode === 'voice') {
      startRecording().catch((err) => {
        console.error('Recording start failed:', err);
        setMode('text');
      });
    }
  }, [initialMode, startRecording]);

  const handleTextConfirm = useCallback(() => {
    if (content.trim()) {
      addTextNote(content.trim());
      handleClose();
    }
  }, [content, addTextNote, handleClose]);

  const handleStartVoice = useCallback(async () => {
    setMode('voice');
    try {
      await startRecording();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setMode('text');
    }
  }, [startRecording]);

  const handleCancelVoice = useCallback(() => {
    cancelRecording();
    setMode('text');
  }, [cancelRecording]);

  const handleVoiceConfirm = useCallback(async () => {
    if (isSavingVoice) return;
    setIsSavingVoice(true);
    try {
      const { blob, duration: recDuration } = await stopRecording();
      if (blob && blob.size > 0) {
        await addVoiceNote(blob, recDuration || duration, content.trim() || undefined);
      }
      handleClose();
    } catch (err) {
      console.error('Failed to save voice note:', err);
    } finally {
      setIsSavingVoice(false);
    }
  }, [isSavingVoice, stopRecording, addVoiceNote, duration, content, handleClose]);


  return (
    <div className={`modal-overlay ${isClosing ? 'modal-overlay--closing' : ''}`} onClick={handleClose}>
      <div
        className="modal-content-animated"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '550px',
          background: 'var(--bg)',
          borderRadius: '24px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
          transition: 'all 200ms ease',
        }}
      >
        {mode === 'text' ? (
          <>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleTextConfirm();
                }
              }}
              placeholder="Type here..."
              autoFocus
              rows={8}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: '16px',
                fontSize: '16px',
                fontFamily: 'DM Sans, var(--font-sans)',
                fontWeight: 400,
                lineHeight: 1.4,
                color: 'var(--text-primary)',
                resize: 'none',
                fieldSizing: 'content',
                minHeight: 'calc(8lh + 32px)',
                maxHeight: 'calc(12lh + 32px)',
                overflowY: 'auto',
                boxSizing: 'border-box',
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <button
                onClick={handleStartVoice}
                type="button"
                title="Record voice note"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '16px',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 150ms ease, border-color 150ms ease',
                }}
              >
                <Mic size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={handleClose}
                  type="button"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '16px',
                    fontFamily: 'Inter, var(--font-sans)',
                    fontWeight: 400,
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 150ms ease, border-color 150ms ease',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleTextConfirm}
                  disabled={!content.trim()}
                  type="button"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--flame)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '16px',
                    fontFamily: 'Inter, var(--font-sans)',
                    fontWeight: 400,
                    color: 'var(--flame)',
                    cursor: content.trim() ? 'pointer' : 'not-allowed',
                    opacity: content.trim() ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'opacity 150ms ease',
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={handleCancelVoice}
                type="button"
                title="Cancel recording"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>

              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Voice Note
              </span>

              <button
                onClick={handleVoiceConfirm}
                disabled={!isPaused && duration === 0}
                type="button"
                title="Confirm & save voice note"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: (isPaused || duration > 0) ? 'var(--flame)' : 'var(--text-secondary)',
                  opacity: (isPaused || duration > 0) ? 1 : 0.4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: (isPaused || duration > 0) ? 'pointer' : 'not-allowed',
                }}
              >
                <Check size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '36px',
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatTime(duration)}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
                height: '48px',
              }}
            >
              {waveform.map((val, i) => {
                const barHeight = isRecording && !isPaused
                  ? Math.max(6, Math.min(46, val * 44 + 4))
                  : 6;
                return (
                  <div
                    key={i}
                    style={{
                      width: '4px',
                      height: `${barHeight}px`,
                      borderRadius: '2px',
                      background: isRecording && !isPaused && val > 0.04 ? 'var(--flame)' : 'var(--border)',
                      transition: 'height 40ms ease-out, background-color 150ms ease',
                    }}
                  />
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                disabled={!isRecording && duration === 0}
                type="button"
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-1)',
                  transition: 'transform 100ms ease',
                }}
              >
                {isPaused ? <Play size={24} /> : <Pause size={24} />}
              </button>

              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {isPaused ? 'Paused' : 'Recording...'}
              </span>
            </div>

            <div style={{ width: '100%', marginTop: '4px' }}>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleVoiceConfirm();
                  }
                }}
                placeholder={duration > 0 ? `Voice note (${Math.max(1, Math.round(duration))}s)` : 'Note title (optional)...'}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '14px',
                  fontFamily: 'DM Sans, var(--font-sans)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
