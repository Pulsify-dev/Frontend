import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlayer } from '../../hooks/usePlayer';
import { PulsifyTrackService } from '../../services/pulsifyTrackService';
import '../playlists/css/PulsifyPlaylists.css';

const generateWaveform = () => Array.from({ length: 200 }, () => Math.random() * 0.7 + 0.3);

export const PulsifyTrackCard = ({ track }) => {
  if (!track) return null;
  const [localTrack, setLocalTrack] = useState(track);
  const navigate = useNavigate();
  const waveform = useMemo(() => generateWaveform(), []);

  const tId = localTrack._id || localTrack.id || localTrack.trackId;
  const artistName = localTrack.artist_id?.display_name || localTrack.artistName || localTrack.artist?.name || localTrack.artist?.displayName || localTrack.artist?.username || 'Unknown Artist';
  const trackTitle = localTrack.title || 'Untitled';
  const coverUrl = localTrack.coverUrl || localTrack.coverArt || localTrack.artwork_url || 'https://placehold.co/160x160/1a1a1a/333?text=♪';

  const [menuOpen, setMenuOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (localTrack) {
      if (localTrack.is_liked !== undefined) {
        setIsLiked(localTrack.is_liked);
      } else if (localTrack.liked !== undefined) {
        setIsLiked(localTrack.liked);
      } else if (tId) {
        PulsifyTrackService.checkIfLiked(tId)
          .then(res => setIsLiked(res.liked || res.is_liked || false))
          .catch(err => console.error('Failed to check track like status', err));
      }
    }
  }, [localTrack, tId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const { togglePlay, isPlaying, currentTrack, playerProgress } = usePlayer();

  const handleCopyLink = (e) => {
    e.stopPropagation();
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/tracks/${tId}`;
    navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard!')).catch(() => alert('Failed to copy link.'));
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    const embedCode = `<iframe src="https://pulsify.page/tracks/embed/${tId}" width="100%" height="166" frameborder="no" allow="autoplay"></iframe>`;
    navigator.clipboard.writeText(embedCode).then(() => {
      alert('Embed iframe copied to clipboard!');
    }).catch(err => console.error('Failed to copy', err));
  };

  const handleLikeClick = async (e) => {
    e.stopPropagation();
    try {
      const prevLiked = isLiked;
      setIsLiked(!isLiked);
      if (prevLiked) {
        await PulsifyTrackService.unlikeTrack(tId);
      } else {
        await PulsifyTrackService.likeTrack(tId);
      }
    } catch (err) {
      console.error('Failed to toggle track like', err);
      setIsLiked(isLiked);
    }
  };

  const isThisTrackPlaying = currentTrack && (currentTrack._id === tId || currentTrack.id === tId || currentTrack.trackId === tId);

  return (
    <div className="pulsify-playlist-card">
      <div className="pulsify-artwork-wrapper" onClick={() => navigate(`/tracks/${tId}`)} style={{ cursor: 'pointer' }}>
        <img
          src={coverUrl}
          alt={trackTitle}
          className="pulsify-artwork"
        />
        <div
          className="pulsify-play-overlay"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay(localTrack);
          }}
        >
          {isPlaying && isThisTrackPlaying ? '⏸' : '▶'}
        </div>
      </div>

      <div className="pulsify-card-body">
        <div className="pulsify-card-header-row">
          <button
            className="pulsify-card-play-btn"
            title={isPlaying && isThisTrackPlaying ? "Pause" : "Play"}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay(localTrack);
            }}
          >
            {isPlaying && isThisTrackPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            )}
          </button>

          <div className="pulsify-card-info">
            <span className="pulsify-card-artist">{artistName}</span>
            <Link to={`/tracks/${tId}`} className="pulsify-card-name">{trackTitle}</Link>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {localTrack.genre && (
              <span className="pulsify-album-type-badge type-album">#{localTrack.genre}</span>
            )}
            <span className="pulsify-card-time">{localTrack.playCount || localTrack.plays || localTrack.play_count || 0} plays</span>
          </div>
        </div>

        <div className="pulsify-card-waveform">
          {waveform.map((h, i) => {
            const isPlayed = isThisTrackPlaying ? (i / waveform.length) * 100 <= (playerProgress || 0) : false;
            return (
              <div
                key={i}
                className="pulsify-card-waveform-bar"
                style={{
                  height: `${Math.max(15, h * 100)}%`,
                  backgroundColor: isPlayed ? '#f50' : 'rgba(255,255,255,0.7)',
                  borderRadius: '1px'
                }}
              />
            );
          })}
        </div>

        <div className="pulsify-card-actions">
          <button className="pulsify-card-action-btn" title="Share" onClick={handleShareClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
          </button>
          <button className="pulsify-card-action-btn" title="Copy Link" onClick={handleCopyLink}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
          </button>
          <button className="pulsify-card-action-btn" title={isLiked ? "Unlike" : "Like"} onClick={handleLikeClick} style={isLiked ? { color: '#f50' } : {}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "#f50" : "currentColor"} stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          </button>

          <div style={{ position: 'relative' }} ref={menuRef}>
            <button className="pulsify-card-action-btn" title="More" onClick={() => setMenuOpen(!menuOpen)} style={menuOpen ? { color: '#f50' } : {}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', top: '38px', left: 0, zIndex: 100,
                backgroundColor: '#111', border: '1px solid #333', borderRadius: '4px',
                minWidth: '180px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                overflow: 'hidden', padding: '4px 0'
              }}>
                <button
                  onClick={() => { setMenuOpen(false); navigate(`/tracks/${tId}`); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                    padding: '10px 16px', background: 'none', border: 'none',
                    color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', textAlign: 'left'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h10M4 18h10M17 14v6M14 17h6" /></svg>
                  Add to Next up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
