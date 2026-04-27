import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingState from "@/components/LoadingState";
import { usePlayer } from "@/hooks/usePlayer";
import {
  clearListeningHistory,
  getListeningHistory,
  getRecentlyPlayed,
  getTrack,
} from "@/services/api";
import "./PlaybackHistoryPage.css";

const HISTORY_CLEAR_MARKER_KEY = "pulsify_history_clear_marker";
const RECENT_TRACK_SLOTS = 6;

const formatDuration = (seconds) => {
  const numericSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(numericSeconds / 60);
  const remainingSeconds = numericSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatRelativePlayedAt = (value) => {
  if (!value) return "Just now";

  const playedAt = new Date(value);
  if (Number.isNaN(playedAt.getTime())) return "Just now";

  const secondsDifference = Math.round(
    (playedAt.getTime() - Date.now()) / 1000
  );
  const absSeconds = Math.abs(secondsDifference);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) return formatter.format(secondsDifference, "second");

  const minutesDifference = Math.round(secondsDifference / 60);
  if (Math.abs(minutesDifference) < 60) {
    return formatter.format(minutesDifference, "minute");
  }

  const hoursDifference = Math.round(minutesDifference / 60);
  if (Math.abs(hoursDifference) < 24) {
    return formatter.format(hoursDifference, "hour");
  }

  const daysDifference = Math.round(hoursDifference / 24);
  if (Math.abs(daysDifference) < 30) {
    return formatter.format(daysDifference, "day");
  }

  const monthsDifference = Math.round(daysDifference / 30);
  if (Math.abs(monthsDifference) < 12) {
    return formatter.format(monthsDifference, "month");
  }

  return formatter.format(Math.round(daysDifference / 365), "year");
};

const createWaveform = (seedSource, length = 110) => {
  const seed = String(seedSource ?? "track")
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return Array.from({ length }, (_, index) => {
    const primary = (Math.sin((index + seed) * 0.39) + 1) / 2;
    const secondary = (Math.cos((index + seed) * 0.17) + 1) / 2;
    return Number((0.18 + primary * 0.46 + secondary * 0.16).toFixed(3));
  });
};

const getPlaybackStateTone = (value) => {
  const normalizedValue = String(value ?? "Playable");

  if (normalizedValue === "Blocked") return "is-blocked";
  if (normalizedValue === "Preview") return "is-preview";
  return "is-playable";
};

const readHistoryClearMarker = () => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(HISTORY_CLEAR_MARKER_KEY) ?? "";
};

const writeHistoryClearMarker = (value) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(HISTORY_CLEAR_MARKER_KEY, value);
};

const shouldKeepHistoryEntry = (entry, clearMarker) => {
  if (!clearMarker) return true;

  const markerDate = new Date(clearMarker);
  const playedAtDate = new Date(entry.played_at ?? entry.playedAt ?? 0);

  if (Number.isNaN(markerDate.getTime()) || Number.isNaN(playedAtDate.getTime())) {
    return true;
  }

  return playedAtDate.getTime() > markerDate.getTime();
};

const matchesFilter = (entry, filterValue) => {
  const normalizedFilter = filterValue.trim().toLowerCase();
  if (!normalizedFilter) return true;

  return [entry.title, entry.artist]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedFilter));
};

const getHistoryTrackId = (entry = {}) => entry.trackId ?? entry.id ?? "";

const enrichHistoryEntry = (entry, detail) => {
  const mergedTrack = detail ?? {};
  const resolvedTrackId = detail?.id ?? getHistoryTrackId(entry);
  const duration = mergedTrack.duration ?? entry.duration ?? 0;
  const durationPlayedMs =
    entry.duration_played_ms ??
    entry.durationPlayedMs ??
    Math.max(duration * 1000, 0);

  return {
    id: resolvedTrackId,
    trackId: resolvedTrackId,
    historyEntryId: entry.historyEntryId ?? entry.id,
    title: mergedTrack.title ?? entry.title ?? "Untitled track",
    artist: mergedTrack.artist ?? entry.artist ?? "Unknown artist",
    cover:
      mergedTrack.cover ??
      entry.cover ??
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=900&auto=format&fit=crop",
    duration,
    audioUrl: mergedTrack.audioUrl ?? "",
    waveform:
      Array.isArray(mergedTrack.waveform) && mergedTrack.waveform.length
        ? mergedTrack.waveform
        : createWaveform(resolvedTrackId),
    playedAt: entry.played_at ?? entry.playedAt ?? new Date().toISOString(),
    durationPlayedMs,
    playbackState: mergedTrack.playbackState ?? "Playable",
    previewStartSeconds: mergedTrack.previewStartSeconds ?? 0,
    previewDurationSeconds: mergedTrack.previewDurationSeconds ?? 0,
    playCount: mergedTrack.playCount ?? 0,
    likeCount: mergedTrack.likeCount ?? 0,
    repostCount: mergedTrack.repostCount ?? 0,
    commentCount: mergedTrack.commentCount ?? 0,
    playedProgress:
      duration > 0 ? Math.min(durationPlayedMs / 1000 / duration, 1) : 0,
  };
};

function HistoryWaveform({
  track,
  currentTrackId,
  currentTime,
  isPlaying,
  onSeek,
}) {
  const shouldAnimate = currentTrackId === track.id;
  const progressRatio =
    shouldAnimate && track.duration > 0
      ? Math.min(currentTime / track.duration, 1)
      : track.playedProgress;

  return (
    <div className="history-waveform" aria-hidden="true">
      {track.waveform.map((point, index) => {
        const progressIndex = Math.round(progressRatio * track.waveform.length);
        const isActive = index <= progressIndex;

        return (
          <button
            key={`${track.id}-wave-${index}`}
            className={`history-wave-bar ${isActive ? "is-active" : ""} ${
              shouldAnimate && isPlaying ? "is-animated" : ""
            }`}
            type="button"
            style={{ "--wave-height": `${Math.max(point * 100, 12)}%` }}
            onClick={(event) => {
              event.stopPropagation();
              if (!track.duration) return;
              onSeek((index / Math.max(track.waveform.length - 1, 1)) * track.duration);
            }}
            aria-label={`Seek to ${formatDuration(
              (index / Math.max(track.waveform.length - 1, 1)) * track.duration
            )}`}
          />
        );
      })}
      <span className="history-waveform-duration">
        {formatDuration(track.duration)}
      </span>
    </div>
  );
}

function PlaybackHistoryPage() {
  const navigate = useNavigate();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    playbackState,
    setPlayerMessage,
    togglePlay,
    loadTrack,
    seekTo,
    setQueueTrackIds,
    syncCurrentTrack,
  } = usePlayer();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [clearMarker, setClearMarker] = useState(() => readHistoryClearMarker());
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [listeningHistory, setListeningHistory] = useState([]);
  const currentTrackId = currentTrack?.id ?? "";

  const allHistoryTracks = useMemo(() => {
    const trackMap = new Map();

    [...recentlyPlayed, ...listeningHistory].forEach((track) => {
      if (!track?.id) return;
      if (!trackMap.has(track.id)) {
        trackMap.set(track.id, track);
      }
    });

    return [...trackMap.values()];
  }, [recentlyPlayed, listeningHistory]);

  const allHistoryTrackIds = useMemo(
    () => allHistoryTracks.map((track) => track.id),
    [allHistoryTracks]
  );

  const filteredRecentlyPlayed = useMemo(
    () => recentlyPlayed.filter((entry) => matchesFilter(entry, filterValue)),
    [recentlyPlayed, filterValue]
  );

  const filteredListeningHistory = useMemo(
    () => listeningHistory.filter((entry) => matchesFilter(entry, filterValue)),
    [listeningHistory, filterValue]
  );

  const refreshHistoryData = async (activeClearMarker = clearMarker) => {
    const [recentEntries, historyEntries] = await Promise.all([
      getRecentlyPlayed(),
      getListeningHistory(),
    ]);

    const visibleRecentEntries = recentEntries.filter((entry) =>
      shouldKeepHistoryEntry(entry, activeClearMarker)
    );
    const visibleHistoryEntries = historyEntries.filter((entry) =>
      shouldKeepHistoryEntry(entry, activeClearMarker)
    );

    const uniqueTrackIds = [
      ...new Set(
        [...visibleRecentEntries, ...visibleHistoryEntries]
          .map((entry) => getHistoryTrackId(entry))
          .filter(Boolean)
      ),
    ];

    const detailResults = await Promise.allSettled(
      uniqueTrackIds.map((trackId) => getTrack(trackId))
    );

    const detailMap = new Map();
    detailResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        detailMap.set(uniqueTrackIds[index], result.value);
      }
    });

    const enrichedRecent = visibleRecentEntries.map((entry) =>
      enrichHistoryEntry(entry, detailMap.get(getHistoryTrackId(entry)))
    );
    const enrichedHistory = visibleHistoryEntries.map((entry) =>
      enrichHistoryEntry(entry, detailMap.get(getHistoryTrackId(entry)))
    );

    setRecentlyPlayed(enrichedRecent);
    setListeningHistory(enrichedHistory);
    setQueueTrackIds(uniqueTrackIds);

    const activeTrack = [...enrichedRecent, ...enrichedHistory].find(
      (entry) => entry.id === currentTrackId
    );
    if (activeTrack) {
      syncCurrentTrack(activeTrack);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError("");
        await refreshHistoryData();
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError?.message || "Could not load playback history.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [clearMarker]);

  const handleTrackPreview = async (track) => {
    if (!track) return;

    if (track.id === currentTrackId) {
      await togglePlay();
      return;
    }

    await loadTrack(track, {
      queueIds: allHistoryTrackIds,
      playbackContext: "history",
      autoplay: true,
    });
  };

  const handleSeekForTrack = async (track, nextValue) => {
    if (!track) return;

    if (track.id === currentTrackId) {
      seekTo(nextValue);
      return;
    }

    await loadTrack(track, {
      queueIds: allHistoryTrackIds,
      playbackContext: "history",
      autoplay: false,
      startTime: nextValue,
    });
  };

  const handleOpenTrack = (trackId) => {
    navigate(`/tracks/${trackId}`);
  };

  const handleClearHistory = async () => {
    try {
      await clearListeningHistory();
      writeHistoryClearMarker("");
      setClearMarker("");
      setFilterValue("");
      await refreshHistoryData("");
      setPlayerMessage("Listening history cleared successfully.");
    } catch (clearError) {
      const nextMarker = new Date().toISOString();
      writeHistoryClearMarker(nextMarker);
      setClearMarker(nextMarker);
      setFilterValue("");
      setPlayerMessage("Listening history cleared for this browser.");
      console.error(clearError);
    }
  };

  if (isLoading) {
    return (
      <div className="app-shell">
        <LoadingState label="Loading your playback history" />
      </div>
    );
  }

  return (
    <div className="app-shell playback-history-shell">
      <main className="page playback-history-page">
        <section className="playback-history-hero">
          <div>
            <span className="tag">Module 5</span>
            <h1>Playback history</h1>
            <p>
              Jump back into the tracks you played recently and reopen any song
              straight into its full track page.
            </p>
          </div>
        </section>

        <section className="playback-history-section">
          <div className="playback-history-header">
            <div>
              <h2>Recently played</h2>
              <p>Fast access to the latest tracks from your listening session.</p>
            </div>

            <div className="playback-history-toolbar">
              <button
                className="playback-history-clear"
                type="button"
                onClick={handleClearHistory}
                disabled={!recentlyPlayed.length && !listeningHistory.length}
              >
                Clear all history
              </button>

              <label className="playback-history-filter">
                <span className="sr-only">Filter playback history</span>
                <input
                  type="search"
                  value={filterValue}
                  onChange={(event) => setFilterValue(event.target.value)}
                  placeholder="Filter"
                />
              </label>
            </div>
          </div>

          <div className="recently-played-grid">
            {filteredRecentlyPlayed.map((track) => {
              const isCurrentTrack = track.id === currentTrackId;

              return (
                <article
                  className={`recently-played-card ${
                    isCurrentTrack ? "is-current" : ""
                  }`}
                  key={`recent-${track.id}`}
                  onClick={() => handleOpenTrack(track.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleOpenTrack(track.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="recently-played-cover">
                    <img src={track.cover} alt={track.title} />
                    <button
                      className="recently-played-play"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleTrackPreview(track);
                      }}
                      aria-label={
                        currentTrackId === track.id && isPlaying
                          ? `Pause ${track.title}`
                          : `Play ${track.title}`
                      }
                    >
                      {currentTrackId === track.id && isPlaying ? "Pause" : "Play"}
                    </button>
                  </div>

                  <div className="recently-played-copy">
                    <strong title={track.title}>{track.title}</strong>
                    <p>{track.artist}</p>
                    <span>{formatRelativePlayedAt(track.playedAt)}</span>
                  </div>
                </article>
              );
            })}

            {Array.from({
              length: Math.max(RECENT_TRACK_SLOTS - filteredRecentlyPlayed.length, 0),
            }).map((_, index) => (
              <div
                className="recently-played-card is-placeholder"
                key={`recent-placeholder-${index}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </section>

        <section className="playback-history-section">
          <div className="playback-history-header is-secondary">
            <div>
              <h2>Hear the tracks you've played</h2>
              <p>
                Each row keeps waveform seek, playback state, and direct
                navigation into the track experience.
              </p>
            </div>
          </div>

          {error ? (
            <div className="playback-history-empty">
              <strong>Could not load everything.</strong>
              <p>{error}</p>
            </div>
          ) : null}

          {!filteredListeningHistory.length ? (
            <div className="playback-history-empty">
              <strong>No tracks matched this view yet.</strong>
              <p>
                {filterValue
                  ? "Try a different filter to see your listening history."
                  : "Play a track and it will show up here automatically."}
              </p>
            </div>
          ) : (
            <div className="playback-history-list">
              {filteredListeningHistory.map((track) => {
                const isCurrentTrack = track.id === currentTrackId;

                return (
                  <article
                    className={`playback-history-row ${
                      isCurrentTrack ? "is-current" : ""
                    }`}
                    key={`history-${track.id}-${track.playedAt}`}
                    onClick={() => handleOpenTrack(track.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenTrack(track.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="playback-history-row-main">
                      <img
                        className="playback-history-cover"
                        src={track.cover}
                        alt={track.title}
                      />

                      <button
                        className={`playback-history-row-play ${
                          isCurrentTrack && isPlaying ? "is-playing" : ""
                        }`}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (isCurrentTrack) {
                            togglePlay();
                            return;
                          }
                          handleTrackPreview(track);
                        }}
                        aria-label={
                          isCurrentTrack && isPlaying
                            ? `Pause ${track.title}`
                            : `Play ${track.title}`
                        }
                      >
                        <span />
                      </button>

                      <div className="playback-history-row-copy">
                        <div className="playback-history-meta">
                          <span className="playback-history-artist">
                            {track.artist}
                          </span>
                          <strong>{track.title}</strong>
                        </div>

                        <HistoryWaveform
                          track={track}
                          currentTrackId={currentTrackId}
                          currentTime={currentTime}
                          isPlaying={isPlaying}
                          onSeek={(seconds) => handleSeekForTrack(track, seconds)}
                        />

                        <div className="playback-history-row-footer">
                          <div className="playback-history-row-stats">
                            <span
                              className={`playback-state-pill ${getPlaybackStateTone(
                                isCurrentTrack ? playbackState : track.playbackState
                              )}`}
                            >
                              {isCurrentTrack ? playbackState : track.playbackState}
                            </span>
                            <span>{track.playCount.toLocaleString()} plays</span>
                            <span>{track.likeCount.toLocaleString()} likes</span>
                            <span>{track.commentCount.toLocaleString()} comments</span>
                          </div>

                          <span className="playback-history-progress">
                            Played {formatDuration(track.durationPlayedMs / 1000)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="playback-history-age">
                      {formatRelativePlayedAt(track.playedAt)}
                    </span>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default PlaybackHistoryPage;
