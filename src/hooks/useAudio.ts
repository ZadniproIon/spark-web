import { useRef, useState, useCallback, useEffect } from 'react';
import fixWebmDuration from 'fix-webm-duration';

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = 1;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  const channelData = buffer.getChannelData(0);
  const dataLength = channelData.length * 2;
  const bufferLength = 44 + dataLength;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < channelData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(() => new Array(24).fill(0));

  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const stopAudioContext = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch (_) {}
      gainNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch (_) {}
      sourceNodeRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (_) {}
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const updateAmplitude = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = audioContextRef.current;

    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (analyser && ctx && ctx.state === 'running') {
      const binCount = analyser.frequencyBinCount;
      const freqData = new Uint8Array(binCount);
      analyser.getByteFrequencyData(freqData);

      let total = 0;
      for (let i = 0; i < binCount; i++) {
        total += freqData[i];
      }
      const avg = total / binCount;
      const normalizedAmp = Math.min(1, avg / 128);

      const barCount = 24;
      const newWave = new Array(barCount);
      for (let i = 0; i < barCount; i++) {
        const binIdx = Math.min(binCount - 1, Math.floor(1 + (i / barCount) * (binCount * 0.7)));
        newWave[i] = freqData[binIdx] / 255;
      }

      setAmplitude(normalizedAmp);
      setWaveform(newWave);
    }
    animFrameRef.current = requestAnimationFrame(updateAmplitude);
  }, []);

  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
      if (!startTimeRef.current) return;
      const now = Date.now();
      const elapsed = Math.floor((now - startTimeRef.current - pausedDurationRef.current) / 1000);
      setDuration(Math.max(0, elapsed));
    }, 200);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4;codecs=aac')
        ? 'audio/mp4;codecs=aac'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      pauseStartTimeRef.current = 0;
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setAmplitude(0);
      setWaveform(new Array(24).fill(0));

      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.4;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -15;

        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        audioContextRef.current = audioCtx;
        sourceNodeRef.current = source;
        analyserRef.current = analyser;
        gainNodeRef.current = gainNode;

        updateAmplitude();
      } catch (err) {
        console.warn('AudioContext setup failed:', err);
      }

      startTimer();
    } catch (err) {
      console.error('Failed to access microphone:', err);
      throw err;
    }
  }, [startTimer, updateAmplitude]);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      pauseStartTimeRef.current = Date.now();
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioContextRef.current && audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend().catch(() => {});
      }
      setAmplitude(0);
      setWaveform(new Array(24).fill(0));
    }
  }, []);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      if (pauseStartTimeRef.current) {
        pausedDurationRef.current += Date.now() - pauseStartTimeRef.current;
        pauseStartTimeRef.current = 0;
      }
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      setIsPaused(false);
      startTimer();
    }
  }, [startTimer]);

  const stop = useCallback((): Promise<{ blob: Blob; duration: number }> => {
    return new Promise((resolve) => {
      const now = Date.now();
      const calculatedDuration = startTimeRef.current
        ? Math.round((now - startTimeRef.current - pausedDurationRef.current) / 1000)
        : duration;
      const finalDuration = Math.max(1, calculatedDuration);
      const recorder = mediaRecorderRef.current;

      const finish = async (rawBlob: Blob) => {
        let finalBlob = rawBlob;
        try {
          const arrayBuffer = await rawBlob.arrayBuffer();
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioCtx();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
          finalBlob = audioBufferToWav(audioBuffer);
          ctx.close().catch(() => {});
        } catch (e) {
          console.warn('WAV conversion failed, falling back to WebM fix:', e);
          if (rawBlob.type.includes('webm')) {
            try {
              finalBlob = await new Promise<Blob>((res) => {
                fixWebmDuration(rawBlob, finalDuration * 1000, (fixedBlob) => {
                  res(fixedBlob);
                });
              });
            } catch (_) {}
          }
        }
        stopAudioContext();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        setIsRecording(false);
        setIsPaused(false);
        setAmplitude(0);
        setWaveform(new Array(24).fill(0));
        resolve({ blob: finalBlob, duration: finalDuration });
      };

      if (!recorder || recorder.state === 'inactive') {
        const mimeType = recorder?.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        finish(blob);
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        finish(blob);
      };

      recorder.stop();
    });
  }, [duration, stopAudioContext]);

  const cancel = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    stopAudioContext();
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAmplitude(0);
    setWaveform(new Array(24).fill(0));
    chunksRef.current = [];
  }, [stopAudioContext]);

  useEffect(() => {
    return () => {
      stopAudioContext();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stopAudioContext]);

  return { isRecording, isPaused, duration, amplitude, waveform, start, stop, pause, resume, cancel };
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDurationState] = useState(0);

  const load = useCallback((url: string) => {
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => setDurationState(audio.duration));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('ended', () => setIsPlaying(false));
    audioRef.current = audio;
  }, []);

  const play = useCallback(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  }, []);

  const pauseAudio = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const skipBack = useCallback(() => {
    if (audioRef.current) seek(Math.max(0, audioRef.current.currentTime - 3));
  }, [seek]);

  const skipForward = useCallback(() => {
    if (audioRef.current) seek(audioRef.current.currentTime + 3);
  }, [seek]);

  return {
    isPlaying,
    currentTime,
    duration,
    load,
    play,
    pause: pauseAudio,
    seek,
    skipBack,
    skipForward,
  };
}
