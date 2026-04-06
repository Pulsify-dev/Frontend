import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PulsifyPlaylistService } from '../services/pulsifyPlaylistService';
import { PulsifyTrackRow } from '../components/playlists/PulsifyTrackRow';
import { PulsifyAuthVaultContext } from '../store/PulsifyAuthVault';

export const PulsifyPlaylistDetailView = () => {
  const { playlistId } = useParams();
  const [playlistDetail, setPlaylistDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const navigate = useNavigate();
  const { isPulsifyPremiumActive } = useContext(PulsifyAuthVaultContext) || { isPulsifyPremiumActive: false };

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

  const handleDragStart = (e, position) => {
    dragItem.current = position;
  };

  const handleDragOver = (e, position) => {
    e.preventDefault();
    dragOverItem.current = position;
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
    
    const newTracks = [...playlistDetail.tracks];
    const draggedTrackContent = newTracks.splice(dragItem.current, 1)[0];
    newTracks.splice(dragOverItem.current, 0, draggedTrackContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    setPlaylistDetail({ ...playlistDetail, tracks: newTracks });
    
    try {
      const trackIds = newTracks.map(t => t.id);
      await PulsifyPlaylistService.reorderTracks(playlistId, trackIds);
    } catch (err) {
      setFetchError('Failed to persist sequence order.');
    }
  };

  const copyEmbedCode = async () => {
    try {
      const embedData = await PulsifyPlaylistService.generateEmbed(playlistId);
      navigator.clipboard.writeText(embedData.embed_html || 'No embed string resolved');
      alert('Embed iframe copied to clipboard!');
    } catch (err) {
      alert('Failed to generate embed code.');
    }
  };

  const handleRemoveTrack = async (indexToRemove) => {
    const newTracks = [...playlistDetail.tracks];
    newTracks.splice(indexToRemove, 1);
    setPlaylistDetail({ ...playlistDetail, tracks: newTracks });
    try {
      const trackIds = newTracks.map(t => t.id);
      await PulsifyPlaylistService.reorderTracks(playlistId, trackIds);
    } catch (err) {
      alert('Failed to sync trace removal.');
    }
  };

  const handleDeleteSet = async () => {
    if (!window.confirm('permanently delete this set?')) return;
    try {
      await PulsifyPlaylistService.deletePlaylist(playlistId);
      navigate('/playlists');
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const handleTogglePrivacy = () => {
    setPlaylistDetail(prev => ({
      ...prev,
      is_private: !prev.is_private
    }));
    alert('Playlist privacy conceptually toggled.');
  };

  const handleOfflineDownload = () => {
    if (!isPulsifyPremiumActive) {
      alert('Offline Listening is a Premium Perk. Please upgrade to Go+ to download sets.');
      navigate('/premium');
      return;
    }
    alert('Starting offline cache download... (Mock Premium Perk Enforced)');
  };

  if (isLoading) return <div className="pulsify-util-msg">Loading...</div>;
  if (fetchError) return <div className="pulsify-util-msg pulsify-err-msg">Error: {fetchError}</div>;
  if (!playlistDetail) return <div className="pulsify-util-msg">Playlist not found.</div>;

  return (
    <div className="pulsify-playlists-container">
      <Link to="/playlists" className="pulsify-btn pulsify-btn-outline" style={{ marginBottom: '20px' }}>
        Back to sets
      </Link>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #e5e5e5' }}>
        <img 
          src={playlistDetail.thumbnail_url || 'https://via.placeholder.com/250'} 
          alt={playlistDetail.title} 
          width="200" 
          height="200" 
          style={{ objectFit: 'cover' }}
        />
        <div style={{ width: '100%' }}>
          <div className="pulsify-badge-row" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {playlistDetail.is_private ? <span className="pulsify-badge-secret">Secret Stash</span> : <span style={{ color: '#999', fontSize: '12px' }}>Public Set</span>}
            <button onClick={handleTogglePrivacy} style={{ background: 'none', border: 'none', color: '#0066cc', cursor: 'pointer', fontSize: '12px' }}>Toggle Privacy</button>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '400', margin: '0 0 10px 0' }}>{playlistDetail.title}</h1>
          <p style={{ margin: '0 0 15px 0', color: '#666' }}>{playlistDetail.description}</p>
          <div style={{ color: '#999', fontSize: '13px', marginBottom: '15px' }}>
            <span>Created by: {playlistDetail.creator_username || 'You'}</span> &bull; 
            <span> {playlistDetail.tracks ? playlistDetail.tracks.length : 0} Tracks</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={copyEmbedCode} className="pulsify-btn pulsify-btn-outline">
              Share & Embed
            </button>
            <button onClick={handleOfflineDownload} className="pulsify-btn pulsify-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              ↓ Offline Download
            </button>
            <button onClick={handleDeleteSet} className="pulsify-btn pulsify-btn-outline" style={{ color: 'red', borderColor: 'rgba(255,0,0,0.3)', marginLeft: 'auto' }}>
              Delete Set
            </button>
          </div>
        </div>
      </div>
      <div>
        {playlistDetail.tracks && playlistDetail.tracks.length > 0 ? (
          playlistDetail.tracks.map((track, idx) => (
            <PulsifyTrackRow 
              key={track.id || idx} 
              track={track} 
              index={idx}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onRemoveTrack={handleRemoveTrack}
            />
          ))
        ) : (
          <p className="pulsify-util-msg">No tracks sequenced yet.</p>
        )}
      </div>
    </div>
  );
};
