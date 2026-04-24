import React, { useState, useEffect } from 'react';
import { PulsifyPlaylistService } from '../services/pulsifyPlaylistService';
import { PulsifySquarePlaylistCard } from '../components/playlists/PulsifySquarePlaylistCard';

export const PulsifyLibraryPlaylists = () => {
  const [pulsifyPlaylists, setPulsifyPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const loadPulsifyData = async () => {
      try {
        setIsLoading(true);
        // In a real scenario, this might fetch both created and liked playlists.
        const data = await PulsifyPlaylistService.retrieveAllPlaylists('me');
        if (isMounted) {
          const rawPlaylists = Array.isArray(data) ? data : data.playlists || [];
          setPulsifyPlaylists(rawPlaylists);
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to retrieve library playlists.');
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
    return <div style={{ color: '#999', padding: '40px' }}>Loading your library...</div>;
  }

  if (fetchError) {
    return <div style={{ color: '#f50', padding: '40px' }}>{fetchError}</div>;
  }

  return (
    <div style={{ backgroundColor: '#111', minHeight: '100vh', fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 20px' }}>
        {/* 
          This is a mock Library shell. 
          When your teammates build the real Library page, you can delete this shell 
          and just drop the grid below into their "Playlists" tab content area!
        */}
        <div style={{ display: 'flex', gap: '32px', paddingTop: '30px' }}>
          {['Overview', 'Likes', 'Playlists', 'Albums', 'Stations', 'Following', 'History'].map(tab => (
            <div 
              key={tab} 
              style={{ 
                paddingBottom: '12px', 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: tab === 'Playlists' ? '#fff' : '#999',
                borderBottom: tab === 'Playlists' ? '3px solid #f50' : '3px solid transparent',
                cursor: 'pointer'
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        <div style={{ paddingTop: '30px', paddingBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#fff', fontSize: '18px', margin: 0 }}>Hear your own playlists and the playlists you've liked:</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Filter" 
              style={{ backgroundColor: '#222', border: '1px solid #333', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '14px' }}
            />
          </div>
        </div>

        {pulsifyPlaylists.length === 0 ? (
          <div style={{ color: '#999', fontSize: '14px', marginTop: '20px' }}>You have no playlists yet.</div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
            gap: '24px',
            width: '100%' 
          }}>
            {pulsifyPlaylists.map((pl) => (
              <PulsifySquarePlaylistCard key={pl._id || pl.id} playlist={pl} />
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
