import { useRef, useState, useCallback } from 'react';

export function useAudioRecorder() {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const timerRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      elapsedRef.current++;
      setDuration(elapsedRef.current);
      const analyser = analyserRef.current;
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAmplitude(avg / 255);
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    chunks.current = [];
    elapsedRef.current = 0;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };

    recorder.start(100);
    mediaRecorder.current = recorder;
    setIsRecording(true);
    setIsPaused(false);

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    audioContext.createMediaStreamSource(stream).connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    startTimer();
  }, [startTimer]);

  const stop = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((t) => t.stop());
    }
    stopTimer();
    audioContextRef.current?.close();
    setIsRecording(false);
    setIsPaused(false);
    const blob = new Blob(chunks.current, { type: 'audio/webm' });
    setDuration(0);
    setAmplitude(0);
    return blob;
  }, [stopTimer]);

  const pause = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, [stopTimer]);

  const resume = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'paused') {
      mediaRecorder.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, [startTimer]);

  return { isRecording, isPaused, duration, amplitude, start, stop, pause, resume };
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
