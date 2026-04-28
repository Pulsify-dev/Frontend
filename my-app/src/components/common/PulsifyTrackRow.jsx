import React from "react";
import "./PulsifyTrackRow.css";
import { usePlayer } from "../../hooks/usePlayer";
import ReportModal from "./ReportModal";

const PulsifyTrackRow = ({ track, onLike, onRepost, isLiked, isReposted }) => {
  const { currentTrack, isPlaying, togglePlay } = usePlayer();
  const isActive = currentTrack?.id === track.trackId;
  const resolvedArtistName =
    track.artist?.name ?? track.artist ?? "Unknown artist";
  const resolvedLiked = Boolean(
    isLiked ?? track.viewerHasLiked ?? track.viewer_has_liked,
  );
  const resolvedReposted = Boolean(
    isReposted ?? track.viewerHasReposted ?? track.viewer_has_reposted,
  );

  // Stable waveform heights — seeded from trackId so they never change per track
  const waveformBars = useMemo(() => {
    const seed = (track.trackId || "")
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return Array.from({ length: 80 }, (_, i) => {
      const v = Math.abs(
        Math.sin((i + seed) * 0.43) * 0.5 + Math.cos((i + seed) * 0.19) * 0.3,
      );
      return Math.round(8 + v * 24);
    });
  }, [track.trackId]);

  const formatDuration = (secs) => {
    if (!secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`sc-track-card ${isActive ? "sc-track-active" : ""}`}
      data-testid={`track-row-${track.trackId}`}
    >
      <div
        className="sc-track-art-wrap"
        onClick={() => togglePlay(track, { playbackContext: "discovery" })}
      >
        <img src={track.coverArt} alt={track.title} className="sc-track-art" />
        <div className="sc-play-overlay">
          <div className="sc-play-circle">
            {isActive && isPlaying ? "Pause" : "Play"}
          </div>
        </div>
      </div>

      <div className="sc-track-body">
        <div className="sc-track-header">
          <div className="sc-track-meta">
            <span className="sc-track-artist">{resolvedArtistName}</span>
            <span className="sc-track-title">{track.title}</span>
          </div>
          <span className="sc-track-time">
            {track.uploadedAt || "Recently"}
          </span>
        </div>

        <div className="sc-waveform">
          <div className="sc-waveform-bars">
            {Array.from({ length: 80 }).map((_, index) => {
              const height = 8 + ((index * 11 + track.trackId.length) % 24);
              return (
                <div
                  key={index}
                  className="sc-wave-bar"
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
          <div className="sc-waveform-duration">
            {formatDuration(track.durationSeconds)}
          </div>
        </div>

        <div className="sc-track-footer">
          <div className="sc-track-actions">
            <button
              className={`sc-btn ${resolvedLiked ? "active" : ""}`}
              onClick={() => onLike(track.trackId)}
              data-testid={`like-btn-${track.trackId}`}
            >
              {"\u2665"} {resolvedLiked ? "Liked" : "Like"}
            </button>
            <button
              className={`sc-btn ${resolvedReposted ? "active" : ""}`}
              onClick={() => onRepost(track.trackId)}
              data-testid={`repost-btn-${track.trackId}`}
            >
              {"\u21C4"} Repost
            </button>
            <button className="sc-btn">{"\u2197"} Share</button>
            <button className="sc-btn">{"\u22EF"} More</button>
          </div>

          <div className="sc-track-counters">
            <span className="sc-counter" title="Plays">
              {"\u25B6"} {Number(track.plays ?? 0).toLocaleString()}
            </span>
            <span className="sc-counter" title="Likes">
              {"\u2665"} {Number(track.likes ?? 0).toLocaleString()}
            </span>
            <span className="sc-counter" title="Reposts">
              {"\u21C4"} {Number(track.reposts ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PulsifyTrackRow;
