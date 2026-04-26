import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const PulsifyTrackRow = ({
  track,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onRemoveTrack,
}) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  if (!track) return null;

  const resolvedTrackId = track.id || track.track_id || track.trackId || "";
  const resolvedTitle = track.title || track.track_title || "Untitled track";
  const resolvedArtist =
    track.artist_name || track.artist?.name || track.artist || "Unknown Artist";
  const resolvedCover =
    track.cover_art_url ||
    track.cover ||
    track.thumbnail_url ||
    "https://placehold.co/28x28/252525/555?text=%E2%99%AB";
  const resolvedDurationSeconds = Number(
    track.duration_seconds || track.duration || 0
  );

  const handleOpenTrack = (event) => {
    event.stopPropagation();

    if (!resolvedTrackId) return;

    navigate(`/tracks/${resolvedTrackId}`);
  };

  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, index)}
      onDragOver={(event) => onDragOver(event, index)}
      onDrop={(event) => onDrop(event, index)}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid #1e1e1e",
        padding: "8px 0",
        cursor: "grab",
        backgroundColor: hovered ? "#1a1a1a" : "transparent",
        transition: "background-color 0.12s ease",
      }}
    >
      <img
        src={resolvedCover}
        alt={resolvedTitle}
        width="28"
        height="28"
        style={{
          marginRight: "8px",
          flexShrink: 0,
          borderRadius: "2px",
          cursor: resolvedTrackId ? "pointer" : "default",
        }}
        onClick={handleOpenTrack}
      />

      <div
        style={{
          width: "28px",
          textAlign: "center",
          marginRight: "10px",
          flexShrink: 0,
        }}
      >
        {hovered ? (
          <button
            type="button"
            onClick={handleOpenTrack}
            style={{
              color: "#f50",
              fontSize: "12px",
              cursor: resolvedTrackId ? "pointer" : "default",
              background: "none",
              border: "none",
              padding: 0,
            }}
            aria-label={
              resolvedTrackId ? `Open ${resolvedTitle}` : "Track unavailable"
            }
          >
            ▶
          </button>
        ) : (
          <span style={{ color: "#555", fontSize: "13px" }}>{index + 1}</span>
        )}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          cursor: resolvedTrackId ? "pointer" : "default",
        }}
        onClick={handleOpenTrack}
      >
        <span
          style={{
            fontSize: "13px",
            color: "#ddd",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
          }}
        >
          {resolvedTitle}
        </span>
        <span style={{ fontSize: "11px", color: "#666" }}>{resolvedArtist}</span>
      </div>

      {hovered && (
        <div
          style={{
            display: "flex",
            gap: "4px",
            marginRight: "12px",
            alignItems: "center",
          }}
        >
          <TrackAction title="Share">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </TrackAction>
          <TrackAction title="Copy link">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </TrackAction>
          <TrackAction title="Like">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </TrackAction>
          <TrackAction title="Repost">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 014-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 01-4 4H3" />
            </svg>
          </TrackAction>
          <TrackAction title="More">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
              <circle cx="5" cy="12" r="1.5" />
            </svg>
          </TrackAction>
        </div>
      )}

      {!hovered && (
        <div
          style={{
            color: "#555",
            fontSize: "12px",
            marginRight: "12px",
            flexShrink: 0,
          }}
        >
          {Math.floor(resolvedDurationSeconds / 60)}:
          {(resolvedDurationSeconds % 60).toString().padStart(2, "0")}
        </div>
      )}

      {onRemoveTrack && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            onRemoveTrack(index);
          }}
          style={{
            background: "none",
            border: "none",
            color: hovered ? "#666" : "transparent",
            cursor: "pointer",
            fontSize: "14px",
            padding: "0 4px",
            transition: "color 0.12s",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.color = "#f44";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.color = "#666";
          }}
          title="Remove track from set"
        >
          &times;
        </button>
      )}
    </div>
  );
};

const TrackAction = ({ children, title }) => (
  <button
    title={title}
    style={{
      width: "26px",
      height: "26px",
      borderRadius: "50%",
      border: "1px solid #333",
      backgroundColor: "#1e1e1e",
      color: "#888",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      transition: "border-color 0.12s, color 0.12s",
    }}
    onMouseEnter={(event) => {
      event.currentTarget.style.borderColor = "#666";
      event.currentTarget.style.color = "#fff";
    }}
    onMouseLeave={(event) => {
      event.currentTarget.style.borderColor = "#333";
      event.currentTarget.style.color = "#888";
    }}
    onClick={(event) => event.stopPropagation()}
  >
    {children}
  </button>
);
