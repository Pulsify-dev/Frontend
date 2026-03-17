import React, { createContext, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = async (track) => {
    // If clicking the same track that is currently playing, toggle pause
    if (currentTrack && currentTrack.trackId === track.trackId) {
      setIsPlaying(!isPlaying);
      return;
    }

    // Otherwise, play the new track
    setCurrentTrack(track);
    setIsPlaying(true);

    // Call DI service to record the play for analytics/history
    try {
      await serviceLocator.discovery.recordPlay(track.trackId);
    } catch (err) {
      console.error("DI play recording failed:", err);
    }
  };

  return (
    <PlayerContext.Provider value={{ currentTrack, isPlaying, togglePlay }}>
      {children}
    </PlayerContext.Provider>
  );
};
