import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import serviceLocator from '../utils/serviceLocator';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import { toggleLike, toggleRepost } from '../services/api';
import './SearchHubPage.css';

const FILTER_TABS = ['Everything', 'Tracks', 'People', 'Albums', 'Playlists'];

const updateTrackRows = (collection, trackId, updater) =>
  collection.map((track) => (track.trackId === trackId ? updater(track) : track));


const SearchHubPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [results, setResults] = useState({ tracks: [], users: [], playlists: [], albums: [] });
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Everything');
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [repostedTracks, setRepostedTracks] = useState(new Set());
  const [followedUsers, setFollowedUsers] = useState(new Set());

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
        if (mounted) {
          setResults(data);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(debounce);
    };
  }, [searchTerm]);

  const handleLike = async (trackId) => {
    const sourceTrack = results.tracks.find((track) => track.trackId === trackId);
    if (!sourceTrack) return;

    const shouldLike = !sourceTrack.viewerHasLiked;

    setResults((prev) => ({
      ...prev,
      tracks: updateTrackRows(prev.tracks, trackId, (track) => ({
        ...track,
        viewerHasLiked: shouldLike,
        likes: Math.max(Number(track.likes ?? 0) + (shouldLike ? 1 : -1), 0),
      })),
    }));

    try {
      await toggleLike(trackId, shouldLike);
    } catch (error) {
      console.error('Like failed:', error);
      setResults((prev) => ({
        ...prev,
        tracks: updateTrackRows(prev.tracks, trackId, (track) => ({
          ...track,
          viewerHasLiked: sourceTrack.viewerHasLiked,
          likes: Number(sourceTrack.likes ?? 0),
        })),
      }));
    }
  };

  const handleRepost = async (trackId) => {
    const sourceTrack = results.tracks.find((track) => track.trackId === trackId);
    if (!sourceTrack) return;

    const shouldRepost = !sourceTrack.viewerHasReposted;

    setResults((prev) => ({
      ...prev,
      tracks: updateTrackRows(prev.tracks, trackId, (track) => ({
        ...track,
        viewerHasReposted: shouldRepost,
        reposts: Math.max(Number(track.reposts ?? 0) + (shouldRepost ? 1 : -1), 0),
      })),
    }));

    try {
      await toggleRepost(trackId, shouldRepost);
    } catch (error) {
      console.error('Repost failed:', error);
      setResults((prev) => ({
        ...prev,
        tracks: updateTrackRows(prev.tracks, trackId, (track) => ({
          ...track,
          viewerHasReposted: sourceTrack.viewerHasReposted,
          reposts: Number(sourceTrack.reposts ?? 0),
        })),
      }));
    }
  };

  const handleFollow = async (userId) => {
    try {
      await serviceLocator.discovery.followUser(userId);
      setFollowedUsers(prev => new Set(prev).add(userId));
    } catch (err) {
      if (err?.response?.status === 409) {
        setFollowedUsers(prev => new Set(prev).add(userId));
      } else {
        console.error("Follow failed:", err);
      }
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await serviceLocator.discovery.unfollowUser(userId);
      setFollowedUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    } catch (err) {
      console.error("Unfollow failed:", err);
    }
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
        <aside className="sc-search-sidebar">
          <div className="sc-search-input-wrap">
            <input
              type="text"
              className="sc-search-input"
              placeholder="Search for artists, bands, tracks, podcasts"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              data-testid="search-input"
            />
            <span className="sc-search-input-icon">{'\u2315'}</span>
          </div>

          <ul className="sc-filter-list">
            {FILTER_TABS.map((tab) => (
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
            <div className="sc-footer-lang">
              Language: <a href="#lang">English (US)</a>
            </div>
          </footer>
        </aside>

        <section className="sc-search-results" data-testid="search-results">
          {loading ? (
            <div className="sc-loader">
              <div className="sc-loader-bar" />
            </div>
          ) : null}

          {!loading && !hasQuery ? (
            <p className="sc-search-prompt">
              Search across the real backend tracks wired into this app.
            </p>
          ) : null}

          {!loading && hasQuery && activeList.length === 0 && (
            <div className="sc-no-results">
              <p>Sorry, we didn't find any results for "<strong>{searchTerm}</strong>" in {activeFilter}</p>
              <span>Check the spelling, or try a different search.</span>
            </div>
          )}

          {!loading && hasQuery && activeList.length > 0 && (
            <div className="sc-track-list">
              <h2 className="sc-search-results-heading">Search results for "{searchTerm}"</h2>
              <div className="sc-search-summary-text">
                Found {results.playlists?.length || 0}+ playlists, {results.tracks?.length || 0}+ tracks, {results.users?.length || 0}+ people, {results.albums?.length || 0}+ albums
              </div>

              {/* Everything tab: show People first, then Tracks */}
              {activeFilter === 'Everything' && (
                <>
                  {results.users.length > 0 && (
                    <>
                      <h3 className="sc-results-section-heading">People</h3>
                      {results.users.slice(0, 3).map(user => (
                        <div key={user.id || user._id} className="sc-user-row-premium">
                          <div className="sc-user-row-premium-left" onClick={() => navigate(`/profile/${user._id || user.id}`)}>
                            <div className="sc-user-premium-avatar">
                              <img src={user.avatar_url || 'https://via.placeholder.com/150'} alt={user.display_name} />
                            </div>
                            <div className="sc-user-premium-info">
                              <div className="sc-user-premium-name">
                                {user.display_name || user.username}
                                {user.is_verified && (
                                  <svg className="sc-verified-badge" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                  </svg>
                                )}
                              </div>
                              <div className="sc-user-premium-followers">
                                👤 {(user.followers_count || 0).toLocaleString()} followers
                              </div>
                            </div>
                          </div>
                          <button
                            className={`sc-user-premium-follow-btn ${followedUsers.has(user.id || user._id) ? 'sc-follow-btn-following' : ''}`}
                            onClick={() => {
                              const uid = user.id || user._id;
                              followedUsers.has(uid) ? handleUnfollow(uid) : handleFollow(uid);
                            }}
                          >{followedUsers.has(user.id || user._id) ? '✓ Following' : 'Follow'}</button>
                        </div>
                      ))}
                    </>
                  )}
                  {results.tracks.length > 0 && (
                    <>
                      <h3 className="sc-results-section-heading">Tracks</h3>
                      {results.tracks.map(track => (
                        <PulsifyTrackRow
                          key={track.trackId || track.id}
                          track={track}
                          onLike={handleLike}
                          onRepost={handleRepost}
                          isLiked={likedTracks.has(track.trackId)}
                          isReposted={repostedTracks.has(track.trackId)}
                        />
                      ))}
                    </>
                  )}
                </>
              )}

              {activeFilter === 'Tracks' && results.tracks.map(track => (
                <PulsifyTrackRow
                  key={track.trackId || track.id}
                  track={track}
                  onLike={handleLike}
                  onRepost={handleRepost}
                  isLiked={track.viewerHasLiked}
                  isReposted={track.viewerHasReposted}
                />
              ))}
              
              {activeFilter === 'People' && results.users.map(user => (
                <div key={user.id || user._id} className="sc-user-row-premium">
                  <div className="sc-user-row-premium-left" onClick={() => navigate(`/profile/${user._id || user.id}`)}>
                    <div className="sc-user-premium-avatar">
                      <img src={user.avatar_url || 'https://via.placeholder.com/150'} alt={user.display_name} />
                    </div>
                    <div className="sc-user-premium-info">
                      <div className="sc-user-premium-name">
                        {user.display_name || user.username}
                        {user.is_verified && (
                          <svg className="sc-verified-badge" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        )}
                      </div>
                      {user.location && <div className="sc-user-premium-location">{user.location}</div>}
                      <div className="sc-user-premium-followers">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                        {(user.followers_count || 0).toLocaleString()} followers
                      </div>
                    </div>
                  </div>
                  <button
                    className={`sc-user-premium-follow-btn ${followedUsers.has(user.id || user._id) ? 'sc-follow-btn-following' : ''}`}
                    onClick={() => {
                      const uid = user.id || user._id;
                      followedUsers.has(uid) ? handleUnfollow(uid) : handleFollow(uid);
                    }}
                  >{followedUsers.has(user.id || user._id) ? '✓ Following' : 'Follow'}</button>
                </div>
              ))}
              
              {activeFilter === 'Albums' && results.albums.map(album => (
                <div key={album.id || album._id} className="sc-album-card">
                  <div className="sc-album-card-art">
                    <img src={album.artwork_url || 'https://via.placeholder.com/80'} alt={album.title} />
                  </div>
                  <div className="sc-album-card-info">
                    <div className="sc-album-card-title">{album.title}</div>
                    <div className="sc-album-card-artist">{album.artist_name || album.artist_username || 'Unknown'}</div>
                    <div className="sc-album-card-meta">
                      <span className="sc-album-card-type">{album.type || 'Album'}</span>
                      {album.genre && <span className="sc-album-card-genre">· {album.genre}</span>}
                      {album.track_count && <span>· {album.track_count} tracks</span>}
                    </div>
                  </div>
                </div>
              ))}
              
              {activeFilter === 'Playlists' && results.playlists.map(pl => (
                <div key={pl.id || pl._id} className="sc-playlist-card" onClick={() => navigate(`/playlists/${pl.id || pl._id}`)}>
                  <div className="sc-playlist-card-art">
                    <img src={pl.cover_url || 'https://via.placeholder.com/80'} alt={pl.title} />
                  </div>
                  <div className="sc-playlist-card-info">
                    <div className="sc-playlist-card-title">{pl.title}</div>
                    <div className="sc-playlist-card-creator">{pl.creator_name || pl.creator_username || ''}</div>
                    <div className="sc-playlist-card-meta">{pl.track_count || 0} tracks</div>
                  </div>
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

