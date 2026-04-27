import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PulsifyAlbumService } from '../services/pulsifyAlbumService';
import { PulsifyTrackRow } from '../components/playlists/PulsifyTrackRow';
import { PulsifyAuthVaultContext } from '../store/PulsifyAuthVault';
import { usePlayer } from '../hooks/usePlayer';
import { PulsifyEditAlbumModal } from '../components/albums/PulsifyEditAlbumModal';
import { PulsifyShareModal } from '../components/playlists/PulsifyShareModal';
import { pulsifyAxiosInstance } from '../services/api';
import '../components/albums/css/PulsifyAlbums.css';

const waveformBars = Array.from({ length: 200 }, () => Math.random() * 0.7 + 0.3);

export const PulsifyAlbumDetailView = () => {
  const { albumId } = useParams();
  const [albumDetail, setAlbumDetail] = useState(null);
  const [userAlbums, setUserAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const navigate = useNavigate();
  const { subscriptionTier } = useContext(PulsifyAuthVaultContext) || { subscriptionTier: 'FREE' };
  const { togglePlay, isPlaying, currentTrack, playerProgress, playerCurrentTime, seekTo } = usePlayer();
  const [artistProfile, setArtistProfile] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (albumDetail && (albumDetail._id || albumDetail.id)) {
      if (albumDetail.is_liked !== undefined) {
        setIsLiked(albumDetail.is_liked);
      } else if (albumDetail.liked !== undefined) {
        setIsLiked(albumDetail.liked);
      } else {
        PulsifyAlbumService.checkIfLiked(albumDetail._id || albumDetail.id)
          .then(res => setIsLiked(res.liked || res.is_liked || false))
          .catch(err => console.error('Failed to check album like status', err));
      }
    }
  }, [albumDetail]);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchTarget = async () => {
      try {
        setIsLoading(true);

        let data = await PulsifyAlbumService.getAlbumById(albumId);
        
        // Unwrap response
        if (data && data.album && typeof data.album === 'object' && !Array.isArray(data.album)) {
          data = data.album;
        } else if (data && data.success && data.data) {
          data = data.data;
        } else if (data && data.data && typeof data.data === 'object' && !data.title && !data._id) {
          data = data.data;
        }

        console.log('[AlbumDetail] Resolved album data:', data);
        if (isMounted) setAlbumDetail(data);

        // Fetch artist profile
        try {
          const artistId = data.artist_id?._id || data.artist_id;
          if (artistId && typeof artistId === 'string') {
            const userRes = await pulsifyAxiosInstance.get(`/users/${artistId}`);
            if (isMounted && userRes.data) {
              setArtistProfile(userRes.data);
            }
          }
        } catch (e) {
          console.error('Failed to fetch artist profile', e);
        }

        // Fetch user's other albums
        try {
          const albData = await PulsifyAlbumService.getMyAlbums();
          if (isMounted) setUserAlbums(albData.albums || albData.data || []);
        } catch (e) { console.error('Failed to fetch user albums', e); }
        
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error occurred fetching this album.';
        if (isMounted) setFetchError(errorMsg);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    if (albumId) fetchTarget();
    return () => { isMounted = false; };
  }, [albumId]);

  const handleDragStart = (e, position) => { dragItem.current = position; };
  const handleDragOver = (e, position) => { e.preventDefault(); dragOverItem.current = position; };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    const newTracks = [...albumDetail.tracks];
    const dragged = newTracks.splice(dragItem.current, 1)[0];
    newTracks.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null;
    dragOverItem.current = null;
    setAlbumDetail({ ...albumDetail, tracks: newTracks });
    try {
      const orderedIds = newTracks.map(t => t.track_id?._id || t.track_id || t.id);
      console.log('[Reorder] albumId:', albumDetail._id, 'orderedIds:', orderedIds);
      await PulsifyAlbumService.reorderTracks(albumDetail._id, orderedIds);
    } catch (err) {
      console.error('[Reorder] Failed:', err.response?.status, err.response?.data);
      setFetchError('Failed to persist track order.');
    }
  };

  const handleShareClick = () => {
    setIsShareModalOpen(true);
  };

  const handleCopyLink = () => {
    if (!albumDetail) return;
    const baseUrl = window.location.origin;
    const albId = albumDetail._id || albumDetail.id;
    const url = `${baseUrl}/albums/${albId}`;
    navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard!')).catch(() => alert('Failed to copy link.'));
  };

  const handleLikeClick = async () => {
    try {
      const prevLiked = isLiked;
      setIsLiked(!isLiked); // Optimistic UI update
      if (prevLiked) {
        await PulsifyAlbumService.unlikeAlbum(albumDetail._id || albumDetail.id);
      } else {
        await PulsifyAlbumService.likeAlbum(albumDetail._id || albumDetail.id);
      }
    } catch (err) {
      console.error('Failed to toggle album like', err);
      setIsLiked(isLiked); // Revert on failure
      alert('Failed to update like status.');
    }
  };

  const handleRemoveTrack = async (indexToRemove) => {
    const trackEntry = albumDetail.tracks[indexToRemove];
    const trackId = trackEntry.track_id?._id || trackEntry.track_id || trackEntry.id;
    const newTracks = [...albumDetail.tracks];
    newTracks.splice(indexToRemove, 1);
    setAlbumDetail({ ...albumDetail, tracks: newTracks, track_count: newTracks.length });
    try {
      await PulsifyAlbumService.removeTrackFromAlbum(albumDetail._id, trackId);
    } catch (err) { alert('Failed to remove track.'); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const objectUrl = URL.createObjectURL(file);
      setAlbumDetail(prev => ({ ...prev, artwork_url: objectUrl }));

      const res = await PulsifyAlbumService.updateArtwork(albumDetail._id, file);
      if (res && res.artwork_url) {
        setAlbumDetail(prev => ({ ...prev, artwork_url: res.artwork_url }));
      }
    } catch (err) {
      console.error('Failed to upload artwork', err);
      alert('Failed to upload album artwork.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = null;
    }
  };

  const handleDeleteAlbum = async () => {
    if (!window.confirm('Permanently delete this album?')) return;
    try {
      await PulsifyAlbumService.deleteAlbum(albumDetail._id);
      navigate('/albums');
    } catch (err) { alert('Delete failed.'); }
  };

  const handleToggleVisibility = async () => {
    const newVis = albumDetail.visibility === 'public' ? 'private' : 'public';
    setAlbumDetail(prev => ({ ...prev, visibility: newVis }));
    try {
      await PulsifyAlbumService.updateAlbum(albumDetail._id, { visibility: newVis });
    } catch (err) {
      setAlbumDetail(prev => ({ ...prev, visibility: albumDetail.visibility }));
      alert('Failed to toggle visibility.');
    }
  };

  const handleOfflineDownload = () => {
    if (subscriptionTier !== 'GO_PLUS') {
      alert('Offline Listening is a Go+ Perk. Please upgrade to Go+ to download albums.');
      navigate('/premium');
      return;
    }
    alert('Starting offline cache download...');
  };

  const openEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleSaveSuccess = (updatedAlbum) => {
    setAlbumDetail(updatedAlbum);
  };


  if (isLoading) return <div style={loadingStyle}>Loading...</div>;
  if (fetchError) return <div style={{ ...loadingStyle, color: '#f44' }}>Error: {fetchError}</div>;
  if (!albumDetail) return <div style={loadingStyle}>Album not found.</div>;

  const trackCount = albumDetail.track_count || albumDetail.tracks?.length || 0;
  const totalSec = albumDetail.tracks?.reduce((s, t) => {
    const dur = t.track_id?.duration || t.duration_seconds || t.duration || 0;
    return s + dur;
  }, 0) || 0;
  const durStr = `${Math.floor(totalSec / 60)}:${(totalSec % 60).toString().padStart(2, '0')}`;
  const albumTypeLower = (albumDetail.type || 'Album').toLowerCase();

  return (
    <div style={{ backgroundColor: '#111', minHeight: '100vh', fontFamily: '"Inter","Helvetica Neue",Arial,sans-serif' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>

        {/* ─── BANNER ─── */}
        <div style={{
          display: 'flex', position: 'relative', overflow: 'hidden',
          backgroundColor: '#6b4e8a',
          height: '380px'
        }}>
          <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <button style={{
                width: '70px', height: '70px', borderRadius: '50%',
                backgroundColor: '#111', border: 'none', color: '#fff',
                fontSize: '24px', cursor: 'pointer',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                transition: 'transform 0.1s'
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                onClick={() => {
                  if (albumDetail.tracks && albumDetail.tracks.length > 0) {
                    const firstTrack = albumDetail.tracks[0].track_id || albumDetail.tracks[0];
                    togglePlay(firstTrack);
                  }
                }}
              >
                {(() => {
                  if (!isPlaying || !currentTrack) return '▶';
                  const currentId = currentTrack?.track_id?._id || currentTrack?.track_id || currentTrack?._id || currentTrack?.id;
                  const isThisAlbumPlaying = albumDetail.tracks?.some(t => {
                    const tId = t.track_id?._id || t.track_id || t._id || t.id;
                    return tId === currentId;
                  });
                  return isThisAlbumPlaying ? '⏸' : '▶';
                })()}
              </button>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', padding: '4px 10px', fontSize: '22px', fontWeight: '400', display: 'inline-block', lineHeight: 1.3 }}>
                    {albumDetail.title}
                  </span>
                  <span className={`pulsify-album-type-badge type-${albumTypeLower}`} style={{ fontSize: '11px', padding: '3px 10px' }}>{albumDetail.type || 'Album'}</span>
                </div>
                <span style={{ backgroundColor: 'rgba(0,0,0,0.75)', color: '#bbb', padding: '2px 10px', fontSize: '13px', display: 'inline-block' }}>
                  {albumDetail.artist_id?.display_name || 'You'}
                </span>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#fff', fontWeight: 'bold', flexShrink: 0 }}>
                {albumDetail.genre || ''}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '80px', marginBottom: '10px' }}>
              {(() => {
                const currentId = currentTrack?.track_id?._id || currentTrack?.track_id || currentTrack?._id || currentTrack?.id;
                const isThisAlbumPlaying = isPlaying && currentTrack && albumDetail.tracks?.some(t => {
                  const tId = t.track_id?._id || t.track_id || t._id || t.id;
                  return tId === currentId;
                });
                return !isThisAlbumPlaying;
              })() ? (
                <div style={{
                  width: '100px', height: '100px', borderRadius: '50%',
                  border: 'none',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  backgroundColor: '#111',
                  alignSelf: 'flex-end'
                }}>
                  <span style={{ fontSize: '30px', fontWeight: '700', color: '#fff', lineHeight: 1 }}>{trackCount}</span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>TRACK{trackCount !== 1 ? 'S' : ''}</span>
                  <span style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{durStr}</span>
                </div>
              ) : (
                <div
                  style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', gap: '2px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = ((e.clientX - rect.left) / rect.width) * 100;
                    if (seekTo) seekTo(pct);
                  }}
                >
                  <div style={{ position: 'absolute', left: 0, bottom: '15px', backgroundColor: '#000', color: '#f50', fontSize: '10px', padding: '2px 4px', zIndex: 2 }}>{formatTime(playerCurrentTime)}</div>
                  <div style={{ position: 'absolute', right: 0, bottom: '15px', backgroundColor: '#000', color: '#fff', fontSize: '10px', padding: '2px 4px', zIndex: 2 }}>{durStr}</div>
                  {waveformBars.map((h, i) => {
                    const isPlayed = (i / waveformBars.length) * 100 <= (playerProgress || 0);
                    return (
                      <div key={i} style={{
                        flex: 1,
                        height: `${Math.max(15, h * 100)}%`,
                        backgroundColor: isPlayed ? '#f50' : 'rgba(255,255,255,0.7)',
                        borderRadius: '1px',
                        pointerEvents: 'none'
                      }} />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={{ width: '340px', height: '340px', flexShrink: 0, alignSelf: 'center', marginRight: '24px', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
            <img
              src={albumDetail.artwork_url || 'https://placehold.co/340x340/2a1e30/666?text=💿'}
              alt={albumDetail.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: isUploadingImage ? 0.5 : 1 }}
            />
            <div style={{ position: 'absolute', bottom: '15px', left: '0', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={() => document.getElementById('album-detail-artwork-upload').click()}
                disabled={isUploadingImage}
                style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 16px', fontSize: '13px', borderRadius: '4px', cursor: isUploadingImage ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }} 
                onMouseEnter={e => { if(!isUploadingImage) e.currentTarget.style.backgroundColor = '#000'; }} 
                onMouseLeave={e => { if(!isUploadingImage) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.7)'; }}
              >
                {isUploadingImage ? 'Uploading...' : 'Upload artwork'}
              </button>
              <input 
                id="album-detail-artwork-upload"
                type="file" 
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>
          </div>
        </div>

        {/* ─── ACTION BUTTONS ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 24px', backgroundColor: '#111' }}>
          <CircleBtn onClick={handleShareClick} title="Share">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
          </CircleBtn>
          <CircleBtn onClick={handleCopyLink} title="Copy Link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
          </CircleBtn>
          <CircleBtn onClick={openEditModal} title="Edit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </CircleBtn>
          <CircleBtn onClick={handleLikeClick} title={isLiked ? "Unlike" : "Like"}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "#f50" : "currentColor"} stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          </CircleBtn>
          <CircleBtn onClick={handleDeleteAlbum} title="Delete">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
          </CircleBtn>
        </div>

        {/* ─── LOWER BODY ─── */}
        <div style={{ display: 'flex', padding: '24px', gap: '16px', backgroundColor: '#111' }}>

          <div style={{ width: '120px', flexShrink: 0, textAlign: 'center' }}>
            <div 
              style={{
                width: '100px', height: '100px', borderRadius: '50%',
                backgroundColor: '#252525', margin: '0 auto 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '36px', color: '#555',
                border: '2px solid #333',
                cursor: 'pointer',
                overflow: 'hidden'
              }}
              onClick={() => {
                const artistId = albumDetail.artist_id?._id || albumDetail.artist_id;
                if (artistId && typeof artistId === 'string') navigate(`/profile/${artistId}`);
              }}
            >
              {(artistProfile?.avatar_url || artistProfile?.avatarUrl || albumDetail.artist_id?.avatar_url) ? (
                <img 
                  src={artistProfile?.avatar_url || artistProfile?.avatarUrl || albumDetail.artist_id?.avatar_url} 
                  alt="Artist" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                '💿'
              )}
            </div>
            <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '2px' }}>
              {artistProfile?.display_name || artistProfile?.username || albumDetail.artist_id?.display_name || 'You'}
            </div>
            <div style={{ fontSize: '11px', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="12" height="12"><path d="M5.75 2v12h1.5V2h-1.5zM13.25 10V6h-1.5v4h1.5zM4.25 5v6h-1.5V5h1.5zM8.75 4v8h1.5V4h-1.5z" fill="currentColor"></path></svg>
              {trackCount}
            </div>
          </div>

          <div style={{ flex: 1, borderLeft: 'none', paddingLeft: '0' }}>
            
            {/* Album Description & Tags Area */}
            {albumDetail.description && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#fff', fontSize: '14px', lineHeight: '1.5', margin: '0 0 10px 0', whiteSpace: 'pre-wrap' }}>
                  {albumDetail.description}
                </p>
                {albumDetail.genre && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ backgroundColor: '#222', color: '#ccc', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}># {albumDetail.genre}</span>
                  </div>
                )}
              </div>
            )}

            {albumDetail.tracks && albumDetail.tracks.length > 0 ? (
              albumDetail.tracks.map((track, idx) => {
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
              <div style={{ color: '#555', padding: '30px 0', fontSize: '14px' }}>No tracks in this album yet.</div>
            )}
          </div>

          {/* ─── RIGHT SIDEBAR ─── */}
          <div style={{ width: '300px', flexShrink: 0, marginTop: '-48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold', textTransform: 'uppercase' }}>Albums from this artist</div>
              <Link to={`/profile/${albumDetail.artist_id?._id || albumDetail.artist_id || ''}`} style={{ fontSize: '11px', color: '#999', cursor: 'pointer', textDecoration: 'none' }}>View all</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {userAlbums.slice(0, 3).map((alb, idx) => (
                <div key={alb._id || idx} style={{ display: 'flex', gap: '10px' }}>
                  <img src={alb.artwork_url || 'https://placehold.co/50x50'} alt={alb.title} style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#ccc' }}>{alb.artist_id?.display_name || 'You'}</span>
                    <Link 
                      to={`/albums/${alb._id || alb.id}`}
                      style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '230px', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >
                      {alb.title}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.6' }}>
              Legal - Privacy - Cookie Policy - Cookie Manager - <br/>
              Imprint - Artist Resources - Newsroom - Charts - <br/>
              Transparency Reports <br/><br/>
              <span style={{ color: '#60b8ff', cursor: 'pointer' }}>Language: English (US)</span>
            </div>
          </div>

        </div>
      </div>

      <PulsifyEditAlbumModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        album={albumDetail}
        onSaveSuccess={handleSaveSuccess}
      />
      <PulsifyShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        playlist={albumDetail}
      />
    </div>
  );
};

const loadingStyle = { background: '#111', color: '#999', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter",sans-serif' };

const CircleBtn = ({ children, onClick, label, danger }) => (
  <button
    onClick={onClick}
    style={{
      width: label ? 'auto' : '40px', height: '36px',
      borderRadius: '3px',
      border: 'none',
      backgroundColor: '#2a2a2a', color: '#fff',
      cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: '5px',
      padding: label ? '0 12px' : '0',
      transition: 'background-color 0.15s',
      fontSize: '13px'
    }}
    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3a3a3a'; }}
    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2a2a2a'; }}
  >
    {children}
    {label && <span>{label}</span>}
  </button>
);
