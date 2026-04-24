import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import serviceLocator from '../utils/serviceLocator';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import './SearchHubPage.css';

const FILTER_TABS = ['Everything', 'Tracks', 'People', 'Albums', 'Playlists'];

const SearchHubPage = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [results, setResults] = useState({ tracks: [], users: [], playlists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Everything');
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [repostedTracks, setRepostedTracks] = useState(new Set());

  useEffect(() => {
    if (!searchTerm.trim()) { 
      setResults({ tracks: [], users: [], playlists: [], albums: [] }); 
      return; 
    }
    let mounted = true;
    setLoading(true);
    const debounce = setTimeout(async () => {
      try {
        const data = await serviceLocator.discovery.searchTracks(searchTerm);
        if (mounted) { setResults(data); setLoading(false); }
      } catch (err) {
        console.error("DI search error:", err);
        if (mounted) setLoading(false);
      }
    }, 400);
    return () => { mounted = false; clearTimeout(debounce); };
  }, [searchTerm]);

  const handleLike = async (trackId) => {
    try {
      if (likedTracks.has(trackId)) {
        setLikedTracks(prev => { const n = new Set(prev); n.delete(trackId); return n; });
      } else {
        await serviceLocator.discovery.likeTrack(trackId);
        setLikedTracks(prev => new Set(prev).add(trackId));
      }
    } catch (e) { console.error("Like failed:", e); }
  };

  const handleRepost = async (trackId) => {
    try {
      if (repostedTracks.has(trackId)) {
        setRepostedTracks(prev => { const n = new Set(prev); n.delete(trackId); return n; });
      } else {
        await serviceLocator.discovery.repostTrack(trackId);
        setRepostedTracks(prev => new Set(prev).add(trackId));
      }
    } catch (e) { console.error("Repost failed:", e); }
  };

  const hasQuery = searchTerm.trim().length > 0;
  
  // Helper to determine the active list based on the filter tab
  const getActiveList = () => {
    if (activeFilter === 'Tracks') return results.tracks;
    if (activeFilter === 'People') return results.users;
    if (activeFilter === 'Playlists') return results.playlists;
    if (activeFilter === 'Albums') return results.albums;
    // For 'Everything', we just combine them or show tracks primarily
    return [...results.tracks, ...results.users, ...results.playlists, ...results.albums];
  };

  const activeList = getActiveList();

  return (
    <div className="sc-search-page" data-testid="search-hub-page">
      <h2 className="sc-page-heading">Search</h2>

      <div className="sc-search-layout">
        {/* Left Sidebar */}
        <aside className="sc-search-sidebar">
          <div className="sc-search-input-wrap">
            <input
              type="text"
              className="sc-search-input"
              placeholder="Search for artists, bands, tracks, podcasts"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="search-input"
            />
            <span className="sc-search-input-icon">🔍</span>
          </div>

          <ul className="sc-filter-list">
            {FILTER_TABS.map(tab => (
              <li
                key={tab}
                className={`sc-filter-item ${activeFilter === tab ? 'active' : ''}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </li>
            ))}
          </ul>

          <footer className="sc-search-footer">
            <div className="sc-footer-links-row">
              <span>Legal</span> · <span>Privacy</span> · <span>Cookie Policy</span>
            </div>
            <div className="sc-footer-links-row">
              <span>Cookie Manager</span> · <span>Imprint</span>
            </div>
            <div className="sc-footer-links-row">
              <span>Artist Resources</span> · <span>Newsroom</span>
            </div>
            <div className="sc-footer-links-row">
              <span>Charts</span> · <span>Transparency Reports</span>
            </div>
            <div className="sc-footer-lang">Language: <a href="#lang">English (US)</a></div>
          </footer>
        </aside>

        {/* Results Area */}
        <section className="sc-search-results" data-testid="search-results">
          {loading && (
            <div className="sc-loader"><div className="sc-loader-bar"></div></div>
          )}

          {!loading && !hasQuery && (
            <p className="sc-search-prompt">
              Search Pulsify for tracks, artists, podcasts, and playlists.
            </p>
          )}

          {!loading && hasQuery && activeList.length === 0 && (
            <div className="sc-no-results">
              <p>Sorry, we didn't find any results for "<strong>{searchTerm}</strong>" in {activeFilter}</p>
              <span>Check the spelling, or try a different search.</span>
            </div>
          )}

          {!loading && activeList.length > 0 && (
            <div className="sc-track-list">
              {activeFilter === 'Everything' || activeFilter === 'Tracks' ? (
                results.tracks.map(track => (
                  <PulsifyTrackRow
                    key={track.trackId || track.id}
                    track={track}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    isLiked={likedTracks.has(track.trackId)}
                    isReposted={repostedTracks.has(track.trackId)}
                  />
                ))
              ) : null}
              
              {/* Dummy rendering for other types to avoid crashing, 
                  ideally we'd have dedicated row components for Users/Albums */}
              {activeFilter === 'People' && results.users.map(user => (
                <div key={user.id || user._id} className="sc-user-row">
                  <div className="sc-user-avatar">
                     <img src={user.avatar_url || 'https://via.placeholder.com/50'} alt={user.display_name} />
                  </div>
                  <span>{user.display_name || user.username}</span>
                </div>
              ))}
              
              {activeFilter === 'Albums' && results.albums.map(album => (
                <div key={album.id || album._id} className="sc-album-row">
                  <span>💿 {album.title}</span>
                </div>
              ))}
              
              {activeFilter === 'Playlists' && results.playlists.map(pl => (
                <div key={pl.id || pl._id} className="sc-playlist-row">
                  <span>🎵 {pl.title}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SearchHubPage;
