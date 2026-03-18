import { useRef, useCallback } from 'react';

interface Voice {
  id: symbol;
  oscillator: OscillatorNode;
  gain: GainNode;
  isActive: boolean;
}

export const useAudioEngine = (maxVoices = 32) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const voicesRef = useRef<Map<symbol, Voice>>(new Map());

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const startVoice = useCallback(async (initialFrequency: number, initialVolume: number): Promise<symbol> => {
    const context = getContext();
    if (context.state === 'suspended') {
      await context.resume();
    }

    if (voicesRef.current.size >= maxVoices) {
      const oldestId = voicesRef.current.keys().next().value;
      if (oldestId) { 
        removeVoice(oldestId);
      }
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = initialFrequency;
    gain.gain.value = 0;

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();

    const now = context.currentTime;
    gain.gain.linearRampToValueAtTime(initialVolume, now + 0.01);

    const id = Symbol();
    voicesRef.current.set(id, { id, oscillator, gain, isActive: true });

    return id;
  }, [getContext, maxVoices]);

  const updateVoice = useCallback((id: symbol, frequency: number, volume: number) => {
    const voice = voicesRef.current.get(id);
    if (!voice || !voice.isActive) return;

    const context = audioContextRef.current;
    if (!context) return;

    const now = context.currentTime;
    voice.oscillator.frequency.linearRampToValueAtTime(frequency, now + 0.02);
    voice.gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  }, []);

  const removeVoice = useCallback((id: symbol) => {
    const voice = voicesRef.current.get(id);
    if (!voice || !voice.isActive) return;

    const context = audioContextRef.current;
    if (context) {
      const now = context.currentTime;
      voice.gain.gain.linearRampToValueAtTime(0, now + 0.05);
      voice.oscillator.stop(now + 0.06);
    }

    voice.isActive = false;
    voicesRef.current.delete(id);
  }, []);

  const stopAllVoices = useCallback(() => {
    voicesRef.current.forEach((_, id) => removeVoice(id));
  }, [removeVoice]);

  return { startVoice, updateVoice, removeVoice, stopAllVoices };
};