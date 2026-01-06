import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const NotificationSoundContext = createContext({
  play: () => {},
  enabled: true,
  setEnabled: () => {},
  volume: 1,
  setVolume: () => {},
});

export function NotificationSoundProvider({ children, src = '/118029-TX/notification-tone.mp3' }) {
  const audioRef = useRef(null);
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('notifSoundEnabled');
    return saved === null ? true : saved === 'true';
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('notifSoundVolume');
    const num = saved !== null ? parseFloat(saved) : 1;
    return Number.isFinite(num) ? Math.min(1, Math.max(0, num)) : 1;
  });

  // Initialize audio lazily on first mount
  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = volume;
    audioRef.current = audio;
    // Try to warm up decoding without playing
    audio.load?.();

    return () => {
      // Clean up
      try {
        audio.pause?.();
      } catch {}
      audioRef.current = null;
    };
  }, [src]);

  // Persist preference changes
  useEffect(() => {
    localStorage.setItem('notifSoundEnabled', String(enabled));
  }, [enabled]);

  useEffect(() => {
    localStorage.setItem('notifSoundVolume', String(volume));
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = useCallback(async () => {
    if (!enabled || !audioRef.current) return;
    try {
      const a = audioRef.current;
      // Restart from beginning for rapid notifications
      a.currentTime = 0;
      await a.play();
    } catch (err) {
      // Autoplay policy likely blocked; noop
      // You can surface a UI hint to enable sound after a user gesture.
      // console.debug('Notification sound blocked by browser policy', err);
    }
  }, [enabled]);

  // Attempt to prime audio on first user interaction to satisfy autoplay policies
  useEffect(() => {
    const handler = async () => {
      const a = audioRef.current;
      if (!a) return cleanup();
      try {
        const prev = a.volume;
        a.volume = 0; // mute during prime
        a.currentTime = 0;
        await a.play();
        a.pause();
        a.currentTime = 0;
        a.volume = prev;
      } catch {
        // ignore
      } finally {
        cleanup();
      }
    };
    const cleanup = () => {
      document.removeEventListener('pointerdown', handler, true);
      document.removeEventListener('keydown', handler, true);
    };
    document.addEventListener('pointerdown', handler, true);
    document.addEventListener('keydown', handler, true);
    return cleanup;
  }, []);

  const value = useMemo(() => ({
    play,
    enabled,
    setEnabled,
    volume,
    setVolume,
  }), [play, enabled, volume]);

  return (
    <NotificationSoundContext.Provider value={value}>
      {children}
    </NotificationSoundContext.Provider>
  );
}

export function useNotificationSoundContext() {
  return useContext(NotificationSoundContext);
}
