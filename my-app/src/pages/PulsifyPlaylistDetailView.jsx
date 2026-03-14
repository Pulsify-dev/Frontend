import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PulsifyPlaylistService } from '../services/pulsifyPlaylistService';
import { PulsifyTrackRow } from '../components/playlists/PulsifyTrackRow';

export const PulsifyPlaylistDetailView = () => {
  const { playlistId } = useParams(); // bnktb el ID mn el URL
  const [playlistDetail, setPlaylistDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadTargetPlaylist = async () => {
      try {
        setIsLoading(true);
        console.log(`Bngib el detail bta3 playlist: ${playlistId} ...`);
        
        const data = await PulsifyPlaylistService.retrievePlaylistById(playlistId);
        
        if (isMounted) {
          setPlaylistDetail(data);
          console.log('gbt el details:', data);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Error occurred fetching this set.');
          console.error('fi moshkela fel fetch detail:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (playlistId) {
      loadTargetPlaylist();
    }
  }, [playlistId]);

  if (isLoading) {
    return <div>Loading details... please hold.</div>;
  }

  if (fetchError) {
    return <div>Error: {fetchError} <Link to="/playlists">Go Back</Link></div>;
  }

  if (!playlistDetail) {
    return <div>Playlist not found.</div>;
  }

  return (
    <div className="pulsify-detail-container" style={{ padding: '20px' }}>
      <Link to="/playlists" style={{ marginBottom: '20px', display: 'inline-block' }}>
        &larr; Back to all sets
      </Link>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <img 
          src={playlistDetail.thumbnailUrl} 
          alt={playlistDetail.playlistName} 
          width="250" 
          height="250" 
        />
        <div>
          <p>{playlistDetail.isPublic ? 'Public Record' : 'Private Stash'}</p>
          <h1>{playlistDetail.playlistName}</h1>
          <p>{playlistDetail.playlistDescription}</p>
          <div style={{ marginTop: '20px', color: '#666' }}>
            <span>Created by: {playlistDetail.creatorId}</span> &bull; 
            <span> {playlistDetail.trackCount} Tracks, {Math.floor(playlistDetail.totalDuration / 60)} mins</span>
          </div>
        </div>
      </div>

      <div className="setup-wrapper-track-list">
        {playlistDetail.tracks && playlistDetail.tracks.length > 0 ? (
          playlistDetail.tracks.map((track, idx) => (
            <PulsifyTrackRow key={track.trackId} track={track} index={idx} />
          ))
        ) : (
          <p>Lessa mfesh tracks hena...</p>
        )}
      </div>
    </div>
  );
};
