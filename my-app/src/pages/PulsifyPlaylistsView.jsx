import React, { useState, useEffect } from 'react';
import { PulsifyPlaylistService } from '../services/pulsifyPlaylistService';
import { PulsifyPlaylistCard } from '../components/playlists/PulsifyPlaylistCard';
import { Link } from 'react-router-dom';
import '../components/playlists/css/PulsifyPlaylists.css';

export const PulsifyPlaylistsView = () => {
  const [pulsifyPlaylists, setPulsifyPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadPulsifyData = async () => {
      try {
        setIsLoading(true);
        const data = await PulsifyPlaylistService.retrieveAllPlaylists('me');
        if (isMounted) {
          setPulsifyPlaylists(Array.isArray(data) ? data : data.playlists || []);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to retrieve playlist context.');
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
    return <div className="pulsify-util-msg">Loading your sets...</div>;
  }

  if (fetchError) {
    return <div className="pulsify-util-msg pulsify-err-msg">{fetchError}</div>;
  }

  return (
    <div className="pulsify-playlists-container">
      <div className="pulsify-header-bar">
        <h2>Your Sets</h2>
        <div className="pulsify-action-group">
          <Link data-testid="upload-track-link" to="/upload" className="pulsify-btn pulsify-btn-dark">
            Upload Track
          </Link>
          <Link data-testid="go-premium-link" to="/premium" className="pulsify-btn pulsify-btn-brand">
            Go Next Pro
          </Link>
        </div>
      </div>
      <div className="pulsify-grid-container">
        {pulsifyPlaylists.length === 0 ? (
          <div className="pulsify-util-msg">You have no sets.</div>
        ) : (
          pulsifyPlaylists.map((pl) => (
            <PulsifyPlaylistCard key={pl.id} playlist={pl} />
          ))
        )}
      </div>
    </div>
  );
};
