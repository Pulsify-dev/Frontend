import React, { useEffect, useState } from 'react';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import { usePlayer } from '../hooks/usePlayer';
import { toggleLike, toggleRepost } from '../services/api';
import { loadConfiguredTrackRows } from '../services/trackSurfaceService';
import './TrendingChartsPage.css';

const GENRE_TABS = ['All music genres', 'Electronic', 'Hip-hop & Rap', 'Pop', 'R&B & Soul', 'Rock', 'Classical'];

const sortTrendingTracks = (tracks) =>
  [...tracks]
    .sort((left, right) => Number(right.plays ?? 0) - Number(left.plays ?? 0))
    .map((track, index) => ({
      ...track,
      rank: index + 1,
    }));

const updateTrackRows = (collection, trackId, updater) =>
  collection.map((track) => (track.trackId === trackId ? updater(track) : track));

const TrendingChartsPage = () => {
  const { setQueueTrackIds } = usePlayer();
  const [trendingData, setTrendingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState('All music genres');

  useEffect(() => {
    let isMounted = true;

    const loadCharts = async () => {
      try {
        const data = await loadConfiguredTrackRows();
        if (isMounted) {
          setTrendingData(sortTrendingTracks(data));
        }
      } catch (error) {
        console.error('Could not load trending tracks.', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCharts();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setQueueTrackIds(trendingData.map((track) => track.trackId));
  }, [setQueueTrackIds, trendingData]);

  const handleLike = async (trackId) => {
    const sourceTrack = trendingData.find((track) => track.trackId === trackId);
    if (!sourceTrack) return;

    const shouldLike = !sourceTrack.viewerHasLiked;

    setTrendingData((currentTracks) =>
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
      setTrendingData((currentTracks) =>
        updateTrackRows(currentTracks, trackId, (track) => ({
          ...track,
          viewerHasLiked: sourceTrack.viewerHasLiked,
          likes: Number(sourceTrack.likes ?? 0),
        })),
      );
    }
  };

  const handleRepost = async (trackId) => {
    const sourceTrack = trendingData.find((track) => track.trackId === trackId);
    if (!sourceTrack) return;

    const shouldRepost = !sourceTrack.viewerHasReposted;

    setTrendingData((currentTracks) =>
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
      setTrendingData((currentTracks) =>
        updateTrackRows(currentTracks, trackId, (track) => ({
          ...track,
          viewerHasReposted: sourceTrack.viewerHasReposted,
          reposts: Number(sourceTrack.reposts ?? 0),
        })),
      );
    }
  };

  return (
    <div className="sc-charts-page" data-testid="trending-charts-page">
      <h2 className="sc-page-heading">Charts: Top 50</h2>
      <p className="sc-page-subtitle">The live track set currently wired into Pulsify</p>

      <div className="sc-genre-tabs">
        {GENRE_TABS.map((genre) => (
          <button
            key={genre}
            className={`sc-genre-tab ${activeGenre === genre ? 'active' : ''}`}
            onClick={() => setActiveGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="sc-loader">
          <div className="sc-loader-bar" />
        </div>
      ) : (
        <div className="sc-chart-list" data-testid="trending-list">
          {trendingData.map((track) => (
            <div key={track.trackId} className="sc-chart-entry">
              <div className="sc-chart-rank">
                <span className="sc-rank-number">{track.rank}</span>
              </div>
              <div className="sc-chart-track">
                <PulsifyTrackRow
                  track={track}
                  onLike={handleLike}
                  onRepost={handleRepost}
                  isLiked={track.viewerHasLiked}
                  isReposted={track.viewerHasReposted}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingChartsPage;
