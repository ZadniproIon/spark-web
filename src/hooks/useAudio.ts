import { useRef, useState, useCallback, useEffect } from 'react';

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [amplitude, setAmplitude] = useState(0);

  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const stopAudioContext = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const updateAmplitude = useCallback(() => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(1, Math.max(0, avg / 128));
      setAmplitude((prev) => prev * 0.7 + normalized * 0.3);
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
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
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

      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
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
      setAmplitude(0);
    }
  }, []);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      if (pauseStartTimeRef.current) {
        pausedDurationRef.current += Date.now() - pauseStartTimeRef.current;
        pauseStartTimeRef.current = 0;
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

      if (!recorder || recorder.state === 'inactive') {
        stopAudioContext();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        setIsRecording(false);
        setIsPaused(false);
        const blob = new Blob(chunksRef.current, { type: recorder?.mimeType || 'audio/webm' });
        resolve({ blob, duration: finalDuration });
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        stopAudioContext();
        setIsRecording(false);
        setIsPaused(false);
        resolve({ blob, duration: finalDuration });
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

  return { isRecording, isPaused, duration, amplitude, start, stop, pause, resume, cancel };
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
