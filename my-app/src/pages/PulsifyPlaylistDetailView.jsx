import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PulsifyPlaylistService } from '../services/pulsifyPlaylistService';
import { PulsifyTrackRow } from '../components/playlists/PulsifyTrackRow';
import { PulsifyAuthVaultContext } from '../store/PulsifyAuthVault';

const waveformBars = Array.from({ length: 200 }, () => Math.random() * 0.7 + 0.3);

export const PulsifyPlaylistDetailView = () => {
  const { playlistId } = useParams();
  const [playlistDetail, setPlaylistDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const navigate = useNavigate();
  const { subscriptionTier } = useContext(PulsifyAuthVaultContext) || { subscriptionTier: 'FREE' };

  useEffect(() => {
    let isMounted = true;
    const fetchTarget = async () => {
      try {
        setIsLoading(true);
        const data = await PulsifyPlaylistService.retrievePlaylistById(playlistId);
        if (isMounted) setPlaylistDetail(data);
      } catch (err) {
        if (isMounted) setFetchError(err.message || 'Error occurred fetching this set.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (playlistId) fetchTarget();
    return () => { isMounted = false; };
  }, [playlistId]);

  const handleDragStart = (e, position) => { dragItem.current = position; };
  const handleDragOver = (e, position) => { e.preventDefault(); dragOverItem.current = position; };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    const newTracks = [...playlistDetail.tracks];
    const dragged = newTracks.splice(dragItem.current, 1)[0];
    newTracks.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null;
    dragOverItem.current = null;
    setPlaylistDetail({ ...playlistDetail, tracks: newTracks });
    try {
      const trackIds = newTracks.map(t => t.track_id?._id || t.track_id || t.id);
      await PulsifyPlaylistService.reorderTracks(playlistId, trackIds);
    } catch (err) {
      setFetchError('Failed to persist sequence order.');
    }
  };

  const copyEmbedCode = async () => {
    try {
      const embedResult = await PulsifyPlaylistService.getEmbedCode(playlistId);
      const embedData = embedResult.data || embedResult;
      const code = embedData.embedCode || embedData.html || 'No embed string resolved';
      navigator.clipboard.writeText(code);
      alert('Embed iframe copied to clipboard!');
    } catch (err) { alert('Failed to generate embed code.'); }
  };

  const handleRemoveTrack = async (indexToRemove) => {
    const trackEntry = playlistDetail.tracks[indexToRemove];
    const trackId = trackEntry.track_id?._id || trackEntry.track_id || trackEntry.id;
    const newTracks = [...playlistDetail.tracks];
    newTracks.splice(indexToRemove, 1);
    setPlaylistDetail({ ...playlistDetail, tracks: newTracks, track_count: newTracks.length });
    try {
      await PulsifyPlaylistService.removeTrackFromPlaylist(playlistId, trackId);
    } catch (err) { alert('Failed to remove track.'); }
  };

  const handleDeleteSet = async () => {
    if (!window.confirm('Permanently delete this set?')) return;
    try {
      await PulsifyPlaylistService.deletePlaylist(playlistId);
      navigate('/playlists');
    } catch (err) { alert('Delete failed.'); }
  };

  const handleTogglePrivacy = async () => {
    const newPrivacy = !playlistDetail.is_private;
    setPlaylistDetail(prev => ({ ...prev, is_private: newPrivacy }));
    try {
      await PulsifyPlaylistService.togglePrivacy(playlistId, newPrivacy);
    } catch (err) {
      setPlaylistDetail(prev => ({ ...prev, is_private: !newPrivacy }));
      alert('Failed to toggle privacy.');
    }
  };

  const handleOfflineDownload = () => {
    if (subscriptionTier !== 'GO_PLUS') {
      alert('Offline Listening is a Go+ Perk. Please upgrade to Go+ to download sets.');
      navigate('/premium');
      return;
    }
    alert('Starting offline cache download...');
  };

  if (isLoading) return <div style={loadingStyle}>Loading...</div>;
  if (fetchError) return <div style={{ ...loadingStyle, color: '#f44' }}>Error: {fetchError}</div>;
  if (!playlistDetail) return <div style={loadingStyle}>Playlist not found.</div>;

  const trackCount = playlistDetail.track_count || playlistDetail.tracks?.length || 0;
  const totalSec = playlistDetail.tracks?.reduce((s, t) => {
    const dur = t.track_id?.duration || t.duration_seconds || t.duration || 0;
    return s + dur;
  }, 0) || 0;
  const durStr = `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, '0')}`;

  return (
    <div style={{ backgroundColor: '#111', minHeight: '100vh', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

        {/* ─── BANNER ─── */}
        <div style={{
          display: 'flex', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #7a5a80 0%, #3e2d44 50%, #2a1e30 100%)',
          height: '340px'
        }}>
          <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <button style={{
                width: '50px', height: '50px', borderRadius: '50%',
                backgroundColor: '#f50', border: 'none', color: '#fff',
                fontSize: '18px', cursor: 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                transition: 'transform 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                ▶
              </button>
              <div style={{ minWidth: 0 }}>
                <span style={{ backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', padding: '4px 10px', fontSize: '22px', fontWeight: '400', display: 'inline-block', lineHeight: 1.3 }}>
                  {playlistDetail.title}
                </span>
                <br />
                <span style={{ backgroundColor: 'rgba(0,0,0,0.75)', color: '#bbb', padding: '2px 10px', fontSize: '13px', display: 'inline-block', marginTop: '3px' }}>
                  {playlistDetail.creator_id?.display_name || playlistDetail.creator_username || 'You'}
                </span>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                Updated 2 hours ago
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.25)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                backgroundColor: 'rgba(0,0,0,0.3)'
              }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff', lineHeight: 1 }}>{trackCount}</span>
                <span style={{ fontSize: '6px', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TRACK{trackCount !== 1 ? 'S' : ''}</span>
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)' }}>{durStr}</span>
              </div>

              <div style={{ flex: 1, height: '55px', display: 'flex', alignItems: 'flex-end', gap: '1px', overflow: 'hidden' }}>
                {waveformBars.map((h, i) => (
                  <div key={i} style={{
                    width: '2px', flexShrink: 0,
                    height: `${h * 100}%`,
                    backgroundColor: i < 60 ? 'rgba(255,85,0,0.7)' : 'rgba(255,255,255,0.35)',
                    borderRadius: '1px 1px 0 0'
                  }} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ width: '280px', height: '280px', flexShrink: 0 }}>
            <img
              src={playlistDetail.cover_url || 'https://placehold.co/280x280/2a1e30/666?text=♫'}
              alt={playlistDetail.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>

        {/* ─── ACTION BUTTONS ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', borderBottom: '1px solid #222', backgroundColor: '#111' }}>
          <CircleBtn label="Share" onClick={copyEmbedCode}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
          </CircleBtn>
          <CircleBtn onClick={() => {}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </CircleBtn>
          <CircleBtn onClick={() => {}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </CircleBtn>
          <CircleBtn onClick={handleTogglePrivacy}>
            {playlistDetail.is_private
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17a2 2 0 002-2 2 2 0 00-2-2 2 2 0 00-2 2 2 2 0 002 2m6-9a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V10a2 2 0 012-2h1V6a5 5 0 0110 0v2h1m-6-2v2h4V6a2 2 0 00-2-2 2 2 0 00-2 2z"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            }
          </CircleBtn>
          <CircleBtn onClick={handleOfflineDownload}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </CircleBtn>
          <CircleBtn onClick={handleDeleteSet} danger>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </CircleBtn>
        </div>

        {/* ─── LOWER BODY ─── */}
        <div style={{ display: 'flex', padding: '24px', gap: '24px', backgroundColor: '#111' }}>

          <div style={{ width: '140px', flexShrink: 0, textAlign: 'center' }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%',
              backgroundColor: '#252525', margin: '0 auto 10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', color: '#555',
              border: '2px solid #333'
            }}>
              ♫
            </div>
            <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '2px' }}>
              {playlistDetail.creator_id?.display_name || playlistDetail.creator_username || 'You'}
            </div>
            <div style={{ fontSize: '11px', color: '#f50', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#f50"><rect x="3" y="14" width="3" height="7" rx="1"/><rect x="8" y="10" width="3" height="11" rx="1"/><rect x="13" y="6" width="3" height="15" rx="1"/><rect x="18" y="2" width="3" height="19" rx="1"/></svg>
              {trackCount}
            </div>
          </div>

          <div style={{ flex: 1, borderLeft: '1px solid #222', paddingLeft: '24px' }}>
            {playlistDetail.tracks && playlistDetail.tracks.length > 0 ? (
              playlistDetail.tracks.map((track, idx) => {
                const trackData = track.track_id && typeof track.track_id === 'object' ? track.track_id : track;
                return (
                  <PulsifyTrackRow
                    key={trackData._id || trackData.id || idx}
                    track={{ ...trackData, _id: trackData._id || trackData.id }}
                    index={idx}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onRemoveTrack={handleRemoveTrack}
                  />
                );
              })
            ) : (
              <div style={{ color: '#555', padding: '30px 0', fontSize: '14px' }}>No tracks in this set yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const loadingStyle = { background: '#111', color: '#999', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter",sans-serif' };

const CircleBtn = ({ children, onClick, label, danger }) => (
  <button
    onClick={onClick}
    style={{
      width: label ? 'auto' : '36px', height: '36px',
      borderRadius: label ? '3px' : '4px',
      border: '1px solid #333',
      backgroundColor: '#1a1a1a', color: danger ? '#c44' : '#999',
      cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '5px',
      padding: label ? '0 12px' : '0',
      transition: 'border-color 0.15s, color 0.15s',
      fontSize: '11px'
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = '#666'; e.currentTarget.style.color = danger ? '#f55' : '#fff'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = danger ? '#c44' : '#999'; }}
  >
    {children}
    {label && <span>{label}</span>}
  </button>
);
