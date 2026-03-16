import React, { useState, useEffect } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import './SearchHubPage.css';

// Container component governing search fetching and local results state
const SearchHubPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }
    
    let mounted = true;
    setLoading(true);

    const performSearch = async () => {
      try {
        const data = await serviceLocator.discovery.searchTracks(searchTerm);
        if (mounted) {
          setResults(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("DI search error:", error);
        if (mounted) setLoading(false);
      }
    };
    
    // Simulate slight keypress debouncing for performance
    const debounceTimeout = setTimeout(performSearch, 400); 
    
    return () => {
      mounted = false;
      clearTimeout(debounceTimeout);
    };
  }, [searchTerm]);

  return (
    <div className="pulsify-search-container" data-testid="search-hub-page">
      <header className="search-header">
        <h2>Global Track Search</h2>
        <div className="search-input-wrapper">
          <input 
            type="text" 
            className="pulsify-search-input"
            placeholder="Search vibrant tracks, artist handles, or global genres..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="search-input"
          />
        </div>
      </header>

      <section className="search-results-area" data-testid="search-results">
        {loading && <div className="search-loader">Analyzing network arrays...</div>}
        
        {!loading && searchTerm && results.length === 0 && (
          <div className="no-results">No audio data matched your query spectrum.</div>
        )}
        
        {!loading && results.map(track => (
          <PulsifyTrackRow 
            key={track.trackId} 
            track={track} 
            onPlay={() => console.log('Intercepted play from SearchHub:', track.title)} 
          />
        ))}
      </section>
    </div>
  );
};

export default SearchHubPage;
