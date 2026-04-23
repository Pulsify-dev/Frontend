import React, { useState, useRef, useEffect } from 'react';
import { usePlayer } from '../../hooks/usePlayer';
import './PulsifyPlayerBar.css';

const PulsifyPlayerBar = () => {
  const { currentTrack, isPlaying, togglePlay, setPlayerProgress, setPlayerCurrentTime } = usePlayer();
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const audioRef = useRef(null);

  // Handle playback state changes
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(err => console.log('Audio play blocked:', err));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration || 1;
      const prog = (current / total) * 100;
      setProgress(prog);
      if (setPlayerProgress) setPlayerProgress(prog);
      if (setPlayerCurrentTime) setPlayerCurrentTime(current);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width);
    const newProgress = Math.max(0, Math.min(100, pct * 100));
    setProgress(newProgress);
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = audioRef.current.duration * pct;
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const durationSecs = currentTrack?.duration || currentTrack?.durationSeconds || currentTrack?.duration_seconds || 180;
  const currentTime = audioRef.current ? audioRef.current.currentTime : 0;
  
  const coverUrl = currentTrack?.artwork_url || currentTrack?.cover_art_url || currentTrack?.coverArt || 'https://placehold.co/40x40/222/555?text=♪';
  const title = currentTrack?.title || 'Unknown Title';
  const artistName = currentTrack?.artist_id?.display_name || currentTrack?.artist_name || currentTrack?.artist?.name || 'Unknown Artist';
  
  // Use backend stream URL if available, otherwise fallback to a default mock stream so sound actually plays
  const [streamUrl, setStreamUrl] = useState('');

  useEffect(() => {
    const fetchStreamUrl = async () => {
      if (!currentTrack) return;
      const trackId = currentTrack?.track_id?._id || currentTrack?.track_id || currentTrack?._id || currentTrack?.id;
      console.log('Player Bar: Fetching stream for trackId:', trackId, 'currentTrack:', currentTrack);
      
      if (!trackId) {
        console.warn('Player Bar: No valid trackId found in currentTrack');
        return;
      }

      try {
        const { getStreamUrl } = await import('../../services/api');
        const data = await getStreamUrl(trackId);
        console.log('Player Bar: Stream URL received:', data?.url);
        if (data && data.url) {
          setStreamUrl(data.url);
        } else {
          console.warn('Player Bar: API returned no URL, falling back');
          setStreamUrl(''); 
        }
      } catch (err) {
        console.error('Player Bar: Failed to get stream URL:', err);
        setStreamUrl('');
      }
    };
    fetchStreamUrl();
  }, [currentTrack]);

  // Priority: 1. Fetched Stream URL, 2. Track's own URLs, 3. No fallback (let it fail) or Mock if explicitly in mock mode
  const audioSrc = streamUrl || currentTrack?.audio_url || currentTrack?.stream_url || currentTrack?.url;

  if (!currentTrack) return null;

  return (
    <div className="sc-player" data-testid="global-player-bar">
      <audio 
        ref={audioRef} 
        src={audioSrc} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={async () => {
          if (currentTrack) {
            const trackId = currentTrack?.track_id?._id || currentTrack?.track_id || currentTrack?._id || currentTrack?.id;
            try {
              const { registerPlay } = await import('../../services/api');
              const durationMs = audioRef.current?.currentTime ? audioRef.current.currentTime * 1000 : 0;
              console.log('Player Bar: Registering play for trackId:', trackId, 'durationMs:', durationMs);
              await registerPlay(trackId, { duration_played_ms: durationMs });
            } catch (err) {
              console.error('Player Bar: Failed to register play:', err);
            }
          }
          togglePlay(currentTrack);
        }} 
      />
      <div className="sc-player-inner">
        {/* Controls */}
        <div className="sc-player-controls">
          <button className="sc-player-btn" title="Previous">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button
            className="sc-player-btn sc-player-play"
            onClick={() => togglePlay(currentTrack)}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button className="sc-player-btn" title="Next">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
          <button className="sc-player-btn" title="Shuffle">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
          </button>
          <button className="sc-player-btn" title="Repeat">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
          </button>
        </div>

        {/* Progress */}
        <div className="sc-player-progress-section">
          <span className="sc-player-time">{formatTime(currentTime)}</span>
          <div className="sc-player-progress-track" onClick={handleSeek}>
            <div className="sc-player-progress-fill" style={{ width: `${progress}%` }}></div>
            <div className="sc-player-progress-handle" style={{ left: `${progress}%` }}></div>
          </div>
          <span className="sc-player-time">{formatTime(audioRef.current?.duration || durationSecs)}</span>
        </div>

        {/* Volume */}
        <div className="sc-player-volume">
          <button className="sc-player-btn" title="Volume">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="sc-volume-slider"
          />
        </div>

        {/* Track Info */}
        <div className="sc-player-trackinfo">
          <img src={coverUrl} alt={title} className="sc-player-art" />
          <div className="sc-player-meta">
            <span className="sc-player-artist">{artistName}</span>
            <span className="sc-player-title">{title}</span>
          </div>
          <div className="sc-player-meta-actions">
             <button className="sc-player-btn" title="Like"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>
             <button className="sc-player-btn" title="Playlist"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="14" height="14" rx="2" ry="2"/><path d="M7 21h14a2 2 0 0 0 2-2V7"/></svg></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PulsifyPlayerBar;
