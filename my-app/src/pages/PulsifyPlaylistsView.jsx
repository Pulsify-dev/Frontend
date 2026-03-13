import React, { useState, useEffect } from 'react';
import { PulsifyPlaylistService } from '../services/pulsifyPlaylistService';
import { PulsifyPlaylistCard } from '../components/playlists/PulsifyPlaylistCard';

/**
 * PulsifyPlaylistsView
 * A stateful page component that fetches data from the DI mock service
 * and manages loading/error states before mapping over the data to render cards.
 */
export const PulsifyPlaylistsView = () => {
  const [pulsifyPlaylists, setPulsifyPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadPulsifyData = async () => {
      try {
        setIsLoading(true);
        // Leaving this console.log in intentionally for the "Struggle Phase" realism
        console.log('[Pulsify System] Attempting to fetch user playlists...');
        
        const data = await PulsifyPlaylistService.retrieveAllPlaylists();
        
        if (isMounted) {
          setPulsifyPlaylists(data);
          console.log('[Pulsify System] Playlists retrieved:', data);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to retrieve playlist context.');
          console.error('[Pulsify System] Fetch Error:', err);
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
