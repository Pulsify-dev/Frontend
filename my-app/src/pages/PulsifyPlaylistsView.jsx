import React, { useState, useEffect } from 'react';
import { PulsifyPlaylistService } from '../services/pulsifyPlaylistService';
import { PulsifyPlaylistCard } from '../components/playlists/PulsifyPlaylistCard';

export const PulsifyPlaylistsView = () => {
  const [pulsifyPlaylists, setPulsifyPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadPulsifyData = async () => {
      try {
        setIsLoading(true);
        // Bn-log 3shan n-debug
        console.log('by-fetch el playlists dlwa2ty...');
        
        const data = await PulsifyPlaylistService.retrieveAllPlaylists();
        
        if (isMounted) {
          setPulsifyPlaylists(data);
          console.log('gibt el playlists:', data);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to retrieve playlist context.');
          console.error('fi moshkela fel fetch:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPulsifyData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <div>Loading your Pulsify Sets... please hold.</div>;
  }

  if (fetchError) {
    return <div>Error loading sets: {fetchError}</div>;
  }

  if (pulsifyPlaylists.length === 0) {
    return <div>No sets found. Time to create your first Pulsify Playlist!</div>;
  }

  return (
    <div className="pulsify-page-container">
      <h2>Your Sets & Playlists</h2>
      <div 
        className="pulsify-grid-container"
        style={{ display: 'flex', flexWrap: 'wrap' }}
      >
        {pulsifyPlaylists.map((pl) => (
          <PulsifyPlaylistCard key={pl.playlistId} playlist={pl} />
        ))}
      </div>
    </div>
  );
};
