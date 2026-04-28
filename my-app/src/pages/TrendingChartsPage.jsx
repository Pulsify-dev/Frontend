import React, { useEffect, useState } from "react";
import PulsifyTrackRow from "../components/common/PulsifyTrackRow";
import { usePlayer } from "../hooks/usePlayer";
import { toggleLike, toggleRepost } from "../services/api";
import { loadConfiguredTrackRows } from "../services/trackSurfaceService";
import "./TrendingChartsPage.css";

const GENRE_TABS = [
  "All music genres",
  "Electronic",
  "Hip-hop & Rap",
  "Pop",
  "R&B & Soul",
  "Rock",
  "Classical",
];

const CHART_CATEGORIES = [
  {
    id: "all",
    title: "Top 50",
    genre: "All music genres",
    cover:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=60",
    type: "chart",
  },
  {
    id: "electronic",
    title: "Electronic",
    genre: "Electronic",
    cover:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=60",
    type: "chart",
  },
  {
    id: "hiphop",
    title: "Hip-hop & Rap",
    genre: "Hip-hop & Rap",
    cover:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=60",
    type: "chart",
  },
  {
    id: "pop",
    title: "Pop",
    genre: "Pop",
    cover:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=60",
    type: "chart",
  },
  {
    id: "rnb",
    title: "R\u0026B \u0026 Soul",
    genre: "R\u0026B \u0026 Soul",
    cover:
      "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=300&auto=format&fit=crop&q=60",
    type: "chart",
  },
  {
    id: "rock",
    title: "Rock",
    genre: "Rock",
    cover:
      "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300&auto=format&fit=crop&q=60",
    type: "chart",
  },
];

const sortTrendingTracks = (tracks) =>
  [...tracks]
    .sort((left, right) => Number(right.plays ?? 0) - Number(left.plays ?? 0))
    .map((track, index) => ({
      ...track,
      rank: index + 1,
    }));

const updateTrackRows = (collection, trackId, updater) =>
  collection.map((track) =>
    track.trackId === trackId ? updater(track) : track,
  );

const TrendingChartsPage = () => {
  const { setQueueTrackIds } = usePlayer();
  const [trendingData, setTrendingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState("All music genres");
  const [viewMode, setViewMode] = useState("grid");
  const [activeChart, setActiveChart] = useState(null);

  const likedTracks = new Set(
    trendingData.filter((t) => t.viewerHasLiked).map((t) => t.trackId),
  );
  const repostedTracks = new Set(
    trendingData.filter((t) => t.viewerHasReposted).map((t) => t.trackId),
  );

  // Load tracks when entering list view
  useEffect(() => {
    let isMounted = true;

    const loadCharts = async () => {
      try {
        const data = await loadConfiguredTrackRows();
        if (isMounted) {
          setTrendingData(sortTrendingTracks(data));
        }
      } catch (error) {
        console.error("Could not load trending tracks.", error);
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
      console.error("Like failed:", error);
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
      console.error("Repost failed:", error);
      setTrendingData((currentTracks) =>
        updateTrackRows(currentTracks, trackId, (track) => ({
          ...track,
          viewerHasReposted: sourceTrack.viewerHasReposted,
          reposts: Number(sourceTrack.reposts ?? 0),
        })),
      );
    }
  };

  const handleChartClick = (chart) => {
    setActiveChart(chart);
    setActiveGenre(
      chart.genre === "All Genres" ? "All music genres" : chart.genre,
    );
    setViewMode("list");
  };

  return (
    <div className="sc-charts-page" data-testid="trending-charts-page">
      <h2 className="sc-page-heading">Charts: Top 50</h2>
      <p className="sc-page-subtitle">
        The live track set currently wired into Pulsify
      </p>

      <div className="sc-genre-tabs">
        {GENRE_TABS.map((genre) => (
          <button
            key={genre}
            className={`sc-genre-tab ${activeGenre === genre ? "active" : ""}`}
            onClick={() => setActiveGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </div>

      {viewMode === "grid" ? (
        loading ? (
          <div className="sc-loader">
            <div className="sc-loader-bar" />
          </div>
        ) : (
          <>
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

            <div className="sc-chart-section" style={{ marginTop: "40px" }}>
              <h3 className="sc-section-heading">New & Hot</h3>
              <p className="sc-page-subtitle" style={{ marginBottom: "16px" }}>
                Up-and-coming tracks on Pulsify
              </p>
              <div className="sc-chart-card-grid">
                {CHART_CATEGORIES.slice()
                  .reverse()
                  .map((chart) => (
                    <div
                      key={`${chart.id}-hot`}
                      className="sc-chart-card"
                      onClick={() => handleChartClick(chart)}
                    >
                      <div className="sc-chart-card-art">
                        <img
                          src={chart.cover}
                          alt={chart.title}
                          style={{ filter: "hue-rotate(90deg)" }}
                        />
                        <div className="sc-chart-card-overlay">
                          <div className="sc-chart-card-title">New & Hot</div>
                          <div className="sc-chart-card-genre">
                            {chart.genre}
                          </div>
                        </div>
                      </div>
                      <div className="sc-chart-card-info">
                        <div className="sc-chart-card-primary">
                          New & Hot {chart.genre}
                        </div>
                        <div className="sc-chart-card-secondary">
                          {chart.type}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )
      ) : (
        <div className="sc-charts-list-view">
          <div className="sc-list-view-header">
            <button className="sc-back-btn" onClick={() => setViewMode("grid")}>
              ← Back to Charts
            </button>
            <h2 className="sc-page-heading" style={{ marginTop: "16px" }}>
              {activeChart
                ? `${activeChart.title} - ${activeChart.genre}`
                : "Charts: Top 50"}
            </h2>
          </div>

          <div className="sc-genre-tabs">
            {GENRE_TABS.map((genre) => (
              <button
                key={genre}
                className={`sc-genre-tab ${activeGenre === genre ? "active" : ""}`}
                onClick={() => setActiveGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="sc-loader">
              <div className="sc-loader-bar"></div>
            </div>
          ) : (
            <div className="sc-chart-list" data-testid="trending-list">
              {trendingData.map((track, index) => (
                <div key={track.trackId} className="sc-chart-entry">
                  <div className="sc-chart-rank">
                    <span className="sc-rank-number">
                      {track.rank || index + 1}
                    </span>
                  </div>
                  <div className="sc-chart-track">
                    <PulsifyTrackRow
                      track={track}
                      onLike={handleLike}
                      onRepost={handleRepost}
                      isLiked={likedTracks.has(track.trackId)}
                      isReposted={repostedTracks.has(track.trackId)}
                      hideContext={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Right Sidebar mimicking SoundCloud */}
      <div className="sc-charts-sidebar">
        <div className="sc-sidebar-section">
          <div className="sc-sidebar-header">
            <h4>ARTIST TOOLS</h4>
            <span className="sc-sidebar-arrow">⌄</span>
          </div>
          <div className="sc-artist-tools-grid">
            <div className="sc-artist-tool">
              <div className="sc-tool-icon">⚡</div>Amplify
            </div>
            <div className="sc-artist-tool">
              <div className="sc-tool-icon">🔄</div>Replace
            </div>
            <div className="sc-artist-tool">
              <div className="sc-tool-icon">🌐</div>Distribute
            </div>
            <div className="sc-artist-tool">
              <div className="sc-tool-icon">🎚️</div>Master
            </div>
          </div>
          <button className="sc-artist-pro-btn">
            ★ Unlock Artist tools from EGP 29.99/month
          </button>
        </div>

        <div className="sc-sidebar-section">
          <div className="sc-sidebar-header">
            <h4>ARTISTS YOU SHOULD FOLLOW</h4>
            <span className="sc-refresh-list">Refresh list</span>
          </div>
          <div className="sc-suggested-artist">
            <img
              src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60"
              alt="Milzy"
              className="sc-suggested-avatar"
            />
            <div className="sc-suggested-info">
              <span className="sc-suggested-name">Milzy ✔</span>
              <span className="sc-suggested-stats">👥 1,275 🎵 6</span>
            </div>
            <button className="sc-follow-btn">Follow</button>
          </div>
          <div className="sc-suggested-artist">
            <img
              src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&auto=format&fit=crop&q=60"
              alt="Jouno"
              className="sc-suggested-avatar"
            />
            <div className="sc-suggested-info">
              <span className="sc-suggested-name">Jouno</span>
              <span className="sc-suggested-stats">👥 133 🎵 6</span>
            </div>
            <button className="sc-follow-btn">Follow</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendingChartsPage;
