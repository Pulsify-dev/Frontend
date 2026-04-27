import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import { usePlayer } from '../hooks/usePlayer';
import { toggleLike, toggleRepost } from '../services/api';
import { loadConfiguredTrackRows } from '../services/trackSurfaceService';
import './SearchHubPage.css';

const FILTER_TABS = ['Everything', 'Tracks', 'People', 'Albums', 'Playlists'];

const updateTrackRows = (collection, trackId, updater) =>
  collection.map((track) => (track.trackId === trackId ? updater(track) : track));

const matchesSearch = (track, searchTerm) => {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  if (!normalizedSearch) return false;

  return [track.title, track.artist?.name]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedSearch));
};

const SearchHubPage = () => {
  const { setQueueTrackIds } = usePlayer();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Everything');

  useEffect(() => {
    let isMounted = true;

    const loadTracks = async () => {
      try {
        setLoading(true);
        const data = await loadConfiguredTrackRows();
        if (isMounted) {
          setTracks(data);
        }
      } catch (error) {
        console.error('Could not load searchable tracks.', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTracks();

    return () => {
      isMounted = false;
    };
  }, []);

  const results = useMemo(() => {
    if (!searchTerm.trim()) return [];
    if (!['Everything', 'Tracks'].includes(activeFilter)) return [];
    return tracks.filter((track) => matchesSearch(track, searchTerm));
  }, [activeFilter, searchTerm, tracks]);

  useEffect(() => {
    setQueueTrackIds(results.map((track) => track.trackId));
  }, [results, setQueueTrackIds]);

  const handleLike = async (trackId) => {
    const sourceTrack = tracks.find((track) => track.trackId === trackId);
    if (!sourceTrack) return;

    const shouldLike = !sourceTrack.viewerHasLiked;

    setTracks((currentTracks) =>
      updateTrackRows(currentTracks, trackId, (track) => ({
        ...track,
        viewerHasLiked: shouldLike,
        likes: Math.max(Number(track.likes ?? 0) + (shouldLike ? 1 : -1), 0),
      })),
    );

    try {
      await toggleLike(trackId, shouldLike);
    } catch (error) {
      console.error('Like failed:', error);
      setTracks((currentTracks) =>
        updateTrackRows(currentTracks, trackId, (track) => ({
          ...track,
          viewerHasLiked: sourceTrack.viewerHasLiked,
          likes: Number(sourceTrack.likes ?? 0),
        })),
      );
    }
  };

  const handleRepost = async (trackId) => {
    const sourceTrack = tracks.find((track) => track.trackId === trackId);
    if (!sourceTrack) return;

    const shouldRepost = !sourceTrack.viewerHasReposted;

    setTracks((currentTracks) =>
      updateTrackRows(currentTracks, trackId, (track) => ({
        ...track,
        viewerHasReposted: shouldRepost,
        reposts: Math.max(
          Number(track.reposts ?? 0) + (shouldRepost ? 1 : -1),
          0,
        ),
      })),
    );

    try {
      await toggleRepost(trackId, shouldRepost);
    } catch (error) {
      console.error('Repost failed:', error);
      setTracks((currentTracks) =>
        updateTrackRows(currentTracks, trackId, (track) => ({
          ...track,
          viewerHasReposted: sourceTrack.viewerHasReposted,
          reposts: Number(sourceTrack.reposts ?? 0),
        })),
      );
    }
  };

  const hasQuery = searchTerm.trim().length > 0;
  const isUnsupportedFilter =
    hasQuery && !['Everything', 'Tracks'].includes(activeFilter);

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

          {!loading && isUnsupportedFilter ? (
            <div className="sc-no-results">
              <p>This search surface is wired for tracks right now.</p>
              <span>Switch to Everything or Tracks to search the live track IDs.</span>
            </div>
          ) : null}

          {!loading && hasQuery && !isUnsupportedFilter && results.length === 0 ? (
            <div className="sc-no-results">
              <p>
                Sorry, we didn&apos;t find any results for "<strong>{searchTerm}</strong>"
              </p>
              <span>Check the spelling, or try a different search.</span>
            </div>
          ) : null}

          {!loading && results.length > 0 ? (
            <div className="sc-track-list">
              {results.map((track) => (
                <PulsifyTrackRow
                  key={track.trackId}
                  track={track}
                  onLike={handleLike}
                  onRepost={handleRepost}
                  isLiked={track.viewerHasLiked}
                  isReposted={track.viewerHasReposted}
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default SearchHubPage;
