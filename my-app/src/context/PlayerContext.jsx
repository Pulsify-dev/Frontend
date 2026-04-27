import React, { createContext, useState, useRef, useCallback } from 'react';
import serviceLocator from '../utils/serviceLocator';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerProgress, setPlayerProgress] = useState(0);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = async (track) => {
    const getTrackId = (t) => t?.track_id?._id || t?.track_id || t?._id || t?.id || t?.trackId;
    const currentId = getTrackId(currentTrack);
    const newId = getTrackId(track);

    // If clicking the same track that is currently playing, toggle pause
    if (currentTrack && currentId && currentId === newId) {
      setIsPlaying(!isPlaying);
      return;
    }

    // Otherwise, play the new track
    setCurrentTrack(track);
    setIsPlaying(true);
    setPlayerProgress(0);
    setPlayerCurrentTime(0);

    // Call DI service to record the play for analytics/history
    try {
      await serviceLocator.discovery.recordPlay(track.trackId);
    } catch (err) {
      console.error("DI play recording failed:", err);
    }
  };

  /** Seek to a percentage (0-100) of the track duration */
  const seekTo = useCallback((percent) => {
    const pct = Math.max(0, Math.min(100, percent));
    setPlayerProgress(pct);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = audioRef.current.duration * (pct / 100);
      setPlayerCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, togglePlay, playerProgress, setPlayerProgress, playerCurrentTime, setPlayerCurrentTime, seekTo, audioRef }}>
      {children}
    </PlayerContext.Provider>
  );
};

