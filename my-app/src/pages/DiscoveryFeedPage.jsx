import React, { useEffect, useState } from 'react';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import { usePlayer } from '../hooks/usePlayer';
import { toggleLike, toggleRepost } from '../services/api';
import { loadConfiguredTrackRows } from '../services/trackSurfaceService';
import './DiscoveryFeedPage.css';

const updateTrackRows = (collection, trackId, updater) =>
  collection.map((track) => (track.trackId === trackId ? updater(track) : track));

const DiscoveryFeedPage = () => {
  const { setQueueTrackIds } = usePlayer();
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadFeed = async () => {
      try {
        const data = await loadConfiguredTrackRows();
        if (isMounted) {
          setFeedData(data);
        }
      } catch (error) {
        console.error('Could not load discovery feed.', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFeed();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setQueueTrackIds(feedData.map((track) => track.trackId));
  }, [feedData, setQueueTrackIds]);

  const handleLike = async (trackId) => {
    const sourceTrack = feedData.find((track) => track.trackId === trackId);
    if (!sourceTrack) return;

    const shouldLike = !sourceTrack.viewerHasLiked;

    setFeedData((currentTracks) =>
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
      setFeedData((currentTracks) =>
        updateTrackRows(currentTracks, trackId, (track) => ({
          ...track,
          viewerHasLiked: sourceTrack.viewerHasLiked,
          likes: Number(sourceTrack.likes ?? 0),
        })),
      );
    }
  };

  const handleRepost = async (trackId) => {
    const sourceTrack = feedData.find((track) => track.trackId === trackId);
    if (!sourceTrack) return;

    const shouldRepost = !sourceTrack.viewerHasReposted;

    setFeedData((currentTracks) =>
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
      setFeedData((currentTracks) =>
        updateTrackRows(currentTracks, trackId, (track) => ({
          ...track,
          viewerHasReposted: sourceTrack.viewerHasReposted,
          reposts: Number(sourceTrack.reposts ?? 0),
        })),
      );
    }
  };

  return (
    <div className="sc-stream-page" data-testid="discovery-feed-page">
      <div className="sc-stream-content">
        <div className="sc-stream-main">
          <h2 className="sc-page-heading">Stream</h2>
          <p className="sc-page-subtitle">Live tracks loaded from the real backend IDs</p>

          {loading ? (
            <div className="sc-loader" data-testid="feed-loading">
              <div className="sc-loader-bar" />
            </div>
          ) : feedData.length === 0 ? (
            <div className="sc-empty-state">
              <h3>Nothing to hear here</h3>
              <p>Those live track IDs did not return data from the backend.</p>
            </div>
          ) : (
            <div className="sc-track-list" data-testid="feed-list">
              {feedData.map((track) => (
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
          )}
        </div>

        <aside className="sc-stream-sidebar">
          <div className="sc-sidebar-section">
            <div className="sc-sidebar-heading">
              <span>Who to follow</span>
            </div>
            <div className="sc-follow-suggestion">
              <div className="sc-suggest-avatar">DJ</div>
              <div className="sc-suggest-info">
                <span className="sc-suggest-name">Studio Waves</span>
                <span className="sc-suggest-followers">Live backend artist</span>
              </div>
              <button className="sc-btn">Follow</button>
            </div>
            <div className="sc-follow-suggestion">
              <div className="sc-suggest-avatar">MX</div>
              <div className="sc-suggest-info">
                <span className="sc-suggest-name">Mix Archive</span>
                <span className="sc-suggest-followers">Queue-ready picks</span>
              </div>
              <button className="sc-btn">Follow</button>
            </div>
          </div>

          <div className="sc-sidebar-footer">
            <div className="sc-footer-links-row">
              <a href="#legal">Legal</a> · <a href="#privacy">Privacy</a> · <a href="#cookie">Cookie Policy</a>
            </div>
            <div className="sc-footer-links-row">
              <a href="#imprint">Imprint</a> · <a href="#charts">Charts</a> · <a href="#news">Newsroom</a>
            </div>
            <div className="sc-footer-lang">Language: <a href="#lang">English (US)</a></div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DiscoveryFeedPage;
