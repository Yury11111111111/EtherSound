import { useRef, useCallback } from 'react';

interface Voice {
  oscillator: OscillatorNode;
  gain: GainNode;
}

export const useAudioEngine = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceRef = useRef<Voice | null>(null);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const startVoice = useCallback(async () => {
    const context = getContext();

    if (context.state === 'suspended') {
     await context.resume();
    } 

    if (voiceRef.current) {
      stopVoice();
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine'; 
    oscillator.frequency.value = 440; 

    gain.gain.value = 0; 

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();

    const now = context.currentTime;
    gain.gain.linearRampToValueAtTime(0.5, now + 0.01);

    voiceRef.current = { oscillator, gain };
  }, [getContext]);

  const updateVoice = useCallback(({ frequency, volume }: { frequency: number; volume: number }) => {
    const voice = voiceRef.current;
    const context = audioContextRef.current;
    if (!voice || !context) return;

    const now = context.currentTime;

    voice.oscillator.frequency.linearRampToValueAtTime(frequency, now + 0.02);
    voice.gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  }, []);

  const stopVoice = useCallback(() => {
    const voice = voiceRef.current;
    const context = audioContextRef.current;
    if (!voice || !context) return;

    const now = context.currentTime;

    voice.gain.gain.linearRampToValueAtTime(0, now + 0.05);

    voice.oscillator.stop(now + 0.06);

    voiceRef.current = null;
  }, []);

  return { startVoice, updateVoice, stopVoice };
};