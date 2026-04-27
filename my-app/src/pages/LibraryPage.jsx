import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AlbumEngagementPanel from "@/components/AlbumEngagementPanel";
import LoadingState from "@/components/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayer } from "@/hooks/usePlayer";
import { profileService } from "@/profile/services/profileService";
import {
  getListeningHistory,
  getRecentlyPlayed,
  getTrack,
  getViewerLikedTracks,
  getViewerRepostedTracks,
  toggleLike,
  toggleRepost,
} from "@/services/api";
import "@/profile/pages/ProfilePage.css";
import "./LibraryPage.css";

const DEFAULT_TRACK_ART =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=900&auto=format&fit=crop";

const LIBRARY_TABS = [
  { label: "Overview", value: "overview" },
  { label: "Popular tracks", value: "popular-tracks" },
  { label: "Likes", value: "likes" },
  { label: "Reposts", value: "reposts" },
  { label: "Playlists", path: "/playlists" },
  { label: "Albums", value: "albums" },
  { label: "Stations", value: "stations" },
  { label: "Following", path: "/following" },
  { label: "History", path: "/history" },
];

const formatDuration = (seconds) => {
  const numericSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(numericSeconds / 60);
  const remainingSeconds = numericSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatCount = (value) => {
  const numericValue = Number(value) || 0;
  if (numericValue >= 1000000) return `${(numericValue / 1000000).toFixed(1)}M`;
  if (numericValue >= 1000) return `${Math.round(numericValue / 100) / 10}K`;
  return `${numericValue}`;
};

const formatRelativePlayedAt = (value) => {
  if (!value) return "Just now";

  const playedAt = new Date(value);
  if (Number.isNaN(playedAt.getTime())) return "Just now";

  const secondsDifference = Math.round((playedAt.getTime() - Date.now()) / 1000);
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
    const primary = (Math.sin((index + seed) * 0.41) + 1) / 2;
    const secondary = (Math.cos((index + seed) * 0.18) + 1) / 2;
    return Number((0.18 + primary * 0.48 + secondary * 0.14).toFixed(3));
  });
};

const getPlaybackStateLabel = (value, previewDurationSeconds = 0) => {
  if (value === "Blocked") return "Blocked";
  if (value === "Preview") {
    return previewDurationSeconds
      ? `Preview only - ${previewDurationSeconds}s`
      : "Preview only";
  }
  return "Playable";
};

const getPlaybackStateTone = (value) => {
  if (value === "Blocked") return "is-blocked";
  if (value === "Preview") return "is-preview";
  return "is-playable";
};

const mergeTrackSnapshot = (track = {}, detail = {}) => ({
  ...track,
  ...detail,
  id: detail.id ?? track.id ?? track.trackId,
  trackId: detail.trackId ?? detail.id ?? track.trackId ?? track.id ?? "",
  historyEntryId: detail.historyEntryId ?? track.historyEntryId ?? null,
  title: detail.title ?? track.title ?? "Untitled track",
  artist: detail.artist ?? track.artist ?? "Unknown artist",
  artistHandle: detail.artistHandle ?? track.artistHandle ?? "",
  cover: detail.cover ?? track.cover ?? "",
  duration: Number(detail.duration ?? track.duration ?? 0),
  playCount: Number(detail.playCount ?? track.playCount ?? 0),
  likeCount: Number(detail.likeCount ?? track.likeCount ?? 0),
  repostCount: Number(detail.repostCount ?? track.repostCount ?? 0),
  commentCount: Number(detail.commentCount ?? track.commentCount ?? 0),
  audioUrl: detail.audioUrl ?? track.audioUrl ?? "",
  playbackState: detail.playbackState ?? track.playbackState ?? "Playable",
  previewDurationSeconds: Number(
    detail.previewDurationSeconds ?? track.previewDurationSeconds ?? 0,
  ),
  previewStartSeconds: Number(
    detail.previewStartSeconds ?? track.previewStartSeconds ?? 0,
  ),
  waveform: detail.waveform ?? track.waveform ?? [],
  postedAt: detail.postedAt ?? track.postedAt ?? null,
  typeLabel: detail.typeLabel ?? track.typeLabel ?? "Music",
  viewerHasLiked: Boolean(detail.viewerHasLiked ?? track.viewerHasLiked),
  viewerHasReposted: Boolean(detail.viewerHasReposted ?? track.viewerHasReposted),
});

const enrichLibraryEntry = (entry, detail = {}) => {
  const mergedTrack = mergeTrackSnapshot(entry, detail);
  const resolvedTrackId = mergedTrack.trackId ?? mergedTrack.id;

  return {
    ...mergedTrack,
    id: resolvedTrackId,
    trackId: resolvedTrackId,
    historyEntryId: entry.historyEntryId ?? entry.id ?? null,
    played_at: entry.played_at ?? entry.playedAt ?? null,
    playedAt: entry.played_at ?? entry.playedAt ?? null,
    duration_played_ms:
      entry.duration_played_ms ??
      entry.durationPlayedMs ??
      Math.max((mergedTrack.duration ?? 0) * 1000, 0),
  };
};

const getPlayedAtTime = (entry = {}) => {
  const timestamp = new Date(entry.played_at ?? entry.playedAt ?? 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortLibraryEntriesByPlayedAt = (entries = []) =>
  [...entries].sort((left, right) => getPlayedAtTime(right) - getPlayedAtTime(left));

const dedupeLibraryEntriesByTrack = (entries = []) => {
  const entryMap = new Map();

  sortLibraryEntriesByPlayedAt(entries).forEach((entry) => {
    if (!entry?.id || entryMap.has(entry.id)) return;
    entryMap.set(entry.id, entry);
  });

  return [...entryMap.values()];
};

const getLibraryTrackId = (entry = {}) => entry.trackId ?? entry.id ?? "";

const updateCollectionTrack = (collection, trackId, snapshot) =>
  collection.map((track) =>
    track.id === trackId
      ? {
          ...track,
          ...snapshot,
        }
      : track,
  );

const removeTrackFromCollection = (collection, trackId) =>
  collection.filter((track) => track.id !== trackId);

const getActiveLibraryTab = (tabValue) => {
  if (
    ["likes", "popular-tracks", "reposts", "albums", "stations"].includes(
      tabValue,
    )
  ) {
    return tabValue;
  }

  return "overview";
};

const getLibraryPathForTab = (tabValue) =>
  tabValue === "overview" ? "/library" : `/library?tab=${tabValue}`;

const broadcastTrackSnapshot = (trackId, track, previousViewerHasLiked) => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("pulsify:track-engagement-updated", {
      detail: {
        trackId,
        track,
        viewerHasLiked: track.viewerHasLiked,
        previousViewerHasLiked,
      },
    }),
  );
};

const PlayGlyph = ({ isPlaying = false }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    {isPlaying ? (
      <>
        <rect x="6" y="5" width="4" height="14" rx="1.5" />
        <rect x="14" y="5" width="4" height="14" rx="1.5" />
      </>
    ) : (
      <path d="M8 5.14v13.72a1 1 0 0 0 1.51.86l10.5-6.86a1 1 0 0 0 0-1.72L9.51 4.28A1 1 0 0 0 8 5.14Z" />
    )}
  </svg>
);

const StatPlayIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.14v13.72a1 1 0 0 0 1.51.86l10.5-6.86a1 1 0 0 0 0-1.72L9.51 4.28A1 1 0 0 0 8 5.14Z" />
  </svg>
);

const HeartIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
  </svg>
);

const RepostIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const CommentIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
  </svg>
);

const LinkIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L10.7 5.23" />
    <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l2.13-2.13" />
  </svg>
);

function TrackMetricLink({ to, icon, label, value }) {
  if (value === null || value === undefined || value === "") return null;

  return (
    <Link className="sc-track-metric sc-track-metric-link" to={to} title={label}>
      {icon}
      <span>{value}</span>
    </Link>
  );
}

function RecentWaveform({ track, isActive, currentTime, onSeek }) {
  const waveform =
    Array.isArray(track.waveform) && track.waveform.length
      ? track.waveform
      : createWaveform(track.id ?? track.title);

  const playedProgress =
    track.duration > 0
      ? Math.min(
          Number(track.duration_played_ms ?? track.durationPlayedMs ?? 0) /
            1000 /
            track.duration,
          1,
        )
      : 0;

  const progressRatio =
    isActive && track.duration > 0
      ? Math.min(currentTime / track.duration, 1)
      : playedProgress;

  return (
    <div className="sc-recent-wave-shell" aria-label={`Waveform for ${track.title}`}>
      <div className="sc-recent-waveform" aria-hidden="true">
        {waveform.map((point, index) => {
          const nextTime =
            track.duration > 0
              ? (index / Math.max(waveform.length - 1, 1)) * track.duration
              : 0;
          const progressIndex = Math.round(progressRatio * waveform.length);
          const isPassed = index <= progressIndex;

          return (
            <button
              key={`${track.id}-wave-${index}`}
              className={`sc-recent-wave-bar ${isPassed ? "is-active" : ""}`}
              type="button"
              style={{ "--wave-height": `${Math.max(point * 100, 12)}%` }}
              onClick={(event) => {
                event.stopPropagation();
                onSeek(nextTime);
              }}
              aria-label={`Seek ${track.title} to ${formatDuration(nextTime)}`}
            />
          );
        })}
      </div>

      <span className="sc-recent-duration">{formatDuration(track.duration)}</span>
    </div>
  );
}

function LibraryTile({ title, subtitle, image, isProfile = false, onClick, isActive = false }) {
  return (
    <button
      className={`library-media-card ${isProfile ? "library-media-card--profile" : ""} ${
        isActive ? "is-active" : ""
      }`}
      type="button"
      onClick={onClick}
    >
      {isProfile ? (
        <div className="library-media-card-avatar">
          {image ? (
            <img src={image} alt={title} />
          ) : (
            <span>{String(title ?? "Y").trim().charAt(0).toUpperCase()}</span>
          )}
        </div>
      ) : (
        <div className="library-media-card-cover">
          <img src={image || DEFAULT_TRACK_ART} alt={title} />
        </div>
      )}

      <div className="library-media-card-copy">
        <strong title={title}>{title}</strong>
        <p>{subtitle}</p>
      </div>
    </button>
  );
}

export default function LibraryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    loadTrack,
    togglePlay,
    seekTo,
    syncCurrentTrack,
    setPlayerMessage,
  } = usePlayer();

  const [viewerProfile, setViewerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [likedTracks, setLikedTracks] = useState([]);
  const [repostedTracks, setRepostedTracks] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [historyTracks, setHistoryTracks] = useState([]);
  const [pendingLikeTrackIds, setPendingLikeTrackIds] = useState({});
  const [pendingRepostTrackIds, setPendingRepostTrackIds] = useState({});
  const currentTrackRef = useRef(null);
  const lastPinnedRecentTrackIdRef = useRef("");

  const activeTab = getActiveLibraryTab(searchParams.get("tab"));

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    let isMounted = true;

    async function loadViewerProfile() {
      try {
        const profile = await profileService.getMyProfile();
        if (isMounted) {
          setViewerProfile(profile);
        }
      } catch {
        if (isMounted && user) {
          setViewerProfile({
            displayName: user.displayName,
            username: user.username,
            avatarUrl: user.avatarUrl,
          });
        }
      }
    }

    loadViewerProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    async function loadLibrarySurfaces() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [likes, reposts, recentEntries, historyEntries] = await Promise.all([
          getViewerLikedTracks(),
          getViewerRepostedTracks(),
          getRecentlyPlayed(),
          getListeningHistory(),
        ]);

        const trackIds = [
          ...new Set(
            [...likes, ...reposts, ...recentEntries, ...historyEntries]
              .map((entry) => getLibraryTrackId(entry))
              .filter(Boolean),
          ),
        ];

        const detailResults = await Promise.allSettled(
          trackIds.map((trackId) => getTrack(trackId)),
        );
        const detailMap = new Map();

        detailResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            detailMap.set(trackIds[index], result.value);
          }
        });

        if (!isMounted) return;

        const nextLikedTracks = likes.map((entry) =>
          mergeTrackSnapshot(entry, detailMap.get(getLibraryTrackId(entry))),
        );
        const nextRepostedTracks = reposts.map((entry) =>
          mergeTrackSnapshot(entry, detailMap.get(getLibraryTrackId(entry))),
        );
        const nextRecentTracks = dedupeLibraryEntriesByTrack(
          recentEntries.map((entry) =>
            enrichLibraryEntry(entry, detailMap.get(getLibraryTrackId(entry))),
          ),
        );
        const nextHistoryTracks = sortLibraryEntriesByPlayedAt(
          historyEntries.map((entry) =>
            enrichLibraryEntry(entry, detailMap.get(getLibraryTrackId(entry))),
          ),
        );

        setLikedTracks(nextLikedTracks);
        setRepostedTracks(nextRepostedTracks);
        setRecentTracks(nextRecentTracks);
        setHistoryTracks(nextHistoryTracks);

        const activeSnapshot = [
          ...nextRecentTracks,
          ...nextHistoryTracks,
          ...nextLikedTracks,
          ...nextRepostedTracks,
        ].find((track) => track.id === currentTrackRef.current?.id);

        if (activeSnapshot) {
          syncCurrentTrack(activeSnapshot);
        }
      } catch (error) {
        console.error("Failed to load library page.", error);
        if (isMounted) {
          setErrorMessage("Could not load your library right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadLibrarySurfaces();

    return () => {
      isMounted = false;
    };
  }, [syncCurrentTrack]);

  useEffect(() => {
    const activeTrack = currentTrackRef.current;

    if (isLoading || !isPlaying || !activeTrack?.id) return;
    if (lastPinnedRecentTrackIdRef.current === activeTrack.id) return;

    lastPinnedRecentTrackIdRef.current = activeTrack.id;
    const playedAt = new Date().toISOString();

    setRecentTracks((current) => {
      const existingTrack = current.find((track) => track.id === activeTrack.id);
      const nextTrack = enrichLibraryEntry(
        {
          ...(existingTrack ?? {}),
          ...activeTrack,
          played_at: playedAt,
          playedAt,
          duration_played_ms: Math.max(Number(activeTrack.duration ?? 0) * 1000, 0),
        },
        activeTrack,
      );

      return [nextTrack, ...current.filter((track) => track.id !== activeTrack.id)].slice(
        0,
        8,
      );
    });

    setHistoryTracks((current) => {
      const existingTrack = current.find((track) => track.id === activeTrack.id);
      const nextTrack = enrichLibraryEntry(
        {
          ...(existingTrack ?? {}),
          ...activeTrack,
          played_at: playedAt,
          playedAt,
          duration_played_ms: Math.max(Number(activeTrack.duration ?? 0) * 1000, 0),
        },
        activeTrack,
      );

      return [nextTrack, ...current];
    });
  }, [currentTrack?.id, isLoading, isPlaying]);

  const libraryTrackQueue = useMemo(
    () => [
      ...new Set(
        [...recentTracks, ...historyTracks, ...likedTracks, ...repostedTracks]
          .map((track) => track.id)
          .filter(Boolean),
      ),
    ],
    [historyTracks, likedTracks, recentTracks, repostedTracks],
  );

  const quickRecentTracks = useMemo(() => recentTracks.slice(0, 5), [recentTracks]);
  const likedPreviewTracks = useMemo(() => likedTracks.slice(0, 6), [likedTracks]);
  const activeOverviewTrack = recentTracks[0] ?? historyTracks[0] ?? null;
  const activeTrackId = currentTrack?.id ?? "";

  const findLocalTrackSnapshot = (trackId) =>
    recentTracks.find((track) => track.id === trackId) ??
    historyTracks.find((track) => track.id === trackId) ??
    likedTracks.find((track) => track.id === trackId) ??
    repostedTracks.find((track) => track.id === trackId) ??
    null;

  const resolveTrackSnapshot = async (trackId) => {
    const localTrack = findLocalTrackSnapshot(trackId);
    if (localTrack) {
      return mergeTrackSnapshot(localTrack);
    }

    try {
      return mergeTrackSnapshot(await getTrack(trackId));
    } catch {
      return mergeTrackSnapshot({ id: trackId });
    }
  };

  const applyTrackSnapshot = (trackId, snapshot) => {
    setRecentTracks((current) => updateCollectionTrack(current, trackId, snapshot));
    setHistoryTracks((current) => updateCollectionTrack(current, trackId, snapshot));

    setLikedTracks((current) => {
      const withoutTrack = removeTrackFromCollection(current, trackId);
      if (!snapshot.viewerHasLiked) {
        return withoutTrack;
      }

      const existingTrack = current.find((track) => track.id === trackId);
      return [mergeTrackSnapshot(existingTrack ?? snapshot, snapshot), ...withoutTrack];
    });

    setRepostedTracks((current) => {
      const withoutTrack = removeTrackFromCollection(current, trackId);
      if (!snapshot.viewerHasReposted) {
        return withoutTrack;
      }

      const existingTrack = current.find((track) => track.id === trackId);
      return [mergeTrackSnapshot(existingTrack ?? snapshot, snapshot), ...withoutTrack];
    });

    if (currentTrackRef.current?.id === trackId) {
      syncCurrentTrack(snapshot);
    }
  };

  useEffect(() => {
    const handleTrackEngagementUpdate = (event) => {
      const { trackId, track } = event.detail ?? {};
      if (!trackId || !track) return;
      applyTrackSnapshot(trackId, mergeTrackSnapshot(track));
    };

    window.addEventListener(
      "pulsify:track-engagement-updated",
      handleTrackEngagementUpdate,
    );

    return () => {
      window.removeEventListener(
        "pulsify:track-engagement-updated",
        handleTrackEngagementUpdate,
      );
    };
  });

  const setPendingTrackState = (setter, trackId, value) => {
    setter((current) => ({
      ...current,
      [trackId]: value,
    }));
  };

  const handleTrackPlayback = async (track, options = {}) => {
    if (!track) return;

    if (activeTrackId === track.id && options.startTime == null) {
      await togglePlay();
      return;
    }

    await loadTrack(track, {
      queueIds: libraryTrackQueue,
      playbackContext: "library",
      autoplay: options.autoplay ?? true,
      ...(typeof options.startTime === "number"
        ? { startTime: options.startTime }
        : {}),
    });
  };

  const handleTrackSeek = async (track, nextValue) => {
    if (!track?.duration) return;

    if (activeTrackId === track.id) {
      seekTo(nextValue);
      return;
    }

    await loadTrack(track, {
      queueIds: libraryTrackQueue,
      playbackContext: "library",
      autoplay: false,
      startTime: nextValue,
    });
  };

  const handleOpenTrack = (track) => {
    if (!track?.id) return;
    navigate(`/tracks/${track.id}`);
  };

  const handleLikeToggle = async (trackId) => {
    if (!trackId || pendingLikeTrackIds[trackId]) return;

    const originalTrack = await resolveTrackSnapshot(trackId);
    const shouldLike = !originalTrack.viewerHasLiked;
    const nextTrackSnapshot = {
      ...originalTrack,
      viewerHasLiked: shouldLike,
      likeCount: Math.max(originalTrack.likeCount + (shouldLike ? 1 : -1), 0),
    };

    setPendingTrackState(setPendingLikeTrackIds, trackId, true);
    applyTrackSnapshot(trackId, nextTrackSnapshot);
    broadcastTrackSnapshot(trackId, nextTrackSnapshot, originalTrack.viewerHasLiked);

    try {
      await toggleLike(trackId, shouldLike);
    } catch (error) {
      console.error("Failed to toggle like from library surface.", error);
      applyTrackSnapshot(trackId, originalTrack);
      broadcastTrackSnapshot(trackId, originalTrack, shouldLike);
      setPlayerMessage?.("Could not update likes right now.");
    } finally {
      setPendingTrackState(setPendingLikeTrackIds, trackId, false);
    }
  };

  const handleRepostToggle = async (trackId) => {
    if (!trackId || pendingRepostTrackIds[trackId]) return;

    const originalTrack = await resolveTrackSnapshot(trackId);
    const shouldRepost = !originalTrack.viewerHasReposted;
    const nextTrackSnapshot = {
      ...originalTrack,
      viewerHasLiked: originalTrack.viewerHasLiked,
      viewerHasReposted: shouldRepost,
      repostCount: Math.max(originalTrack.repostCount + (shouldRepost ? 1 : -1), 0),
    };

    setPendingTrackState(setPendingRepostTrackIds, trackId, true);
    applyTrackSnapshot(trackId, nextTrackSnapshot);
    broadcastTrackSnapshot(trackId, nextTrackSnapshot, originalTrack.viewerHasLiked);

    try {
      await toggleRepost(trackId, shouldRepost);
    } catch (error) {
      console.error("Failed to toggle repost from library surface.", error);
      applyTrackSnapshot(trackId, originalTrack);
      broadcastTrackSnapshot(trackId, originalTrack, originalTrack.viewerHasLiked);
      setPlayerMessage?.("Could not update reposts right now.");
    } finally {
      setPendingTrackState(setPendingRepostTrackIds, trackId, false);
    }
  };

  const renderMetricLinks = (track) => (
    <>
      <TrackMetricLink
        to={`/tracks/${track.id}`}
        icon={<StatPlayIcon />}
        label="Plays"
        value={formatCount(track.playCount)}
      />
      <TrackMetricLink
        to={`/tracks/${track.id}/likes`}
        icon={<HeartIcon />}
        label="Likes"
        value={formatCount(track.likeCount)}
      />
      <TrackMetricLink
        to={`/tracks/${track.id}/reposts`}
        icon={<RepostIcon />}
        label="Reposts"
        value={formatCount(track.repostCount)}
      />
      <TrackMetricLink
        to={`/tracks/${track.id}/comments`}
        icon={<CommentIcon />}
        label="Comments"
        value={formatCount(track.commentCount)}
      />
    </>
  );

  const renderHeroTrackCard = (track, keyPrefix = "library") => {
    const isCurrentTrack = activeTrackId === track.id;
    const isLikePending = Boolean(pendingLikeTrackIds[track.id]);
    const isRepostPending = Boolean(pendingRepostTrackIds[track.id]);

    return (
      <article
        className={`sc-recent-hero ${isCurrentTrack ? "is-current" : ""}`}
        key={`${keyPrefix}-${track.id}-${track.played_at ?? track.playedAt ?? track.title}`}
      >
        <button
          className="sc-recent-cover"
          type="button"
          onClick={() => handleOpenTrack(track)}
        >
          <img src={track.cover || DEFAULT_TRACK_ART} alt={track.title} />
        </button>

        <div className="sc-recent-body">
          <div className="sc-recent-head">
            <div className="sc-recent-heading">
              <button
                className={`sc-recent-play-circle ${isCurrentTrack && isPlaying ? "is-playing" : ""}`}
                type="button"
                onClick={() => handleTrackPlayback(track)}
                aria-label={
                  isCurrentTrack && isPlaying
                    ? `Pause ${track.title}`
                    : `Play ${track.title}`
                }
              >
                <PlayGlyph isPlaying={isCurrentTrack && isPlaying} />
              </button>

              <div className="sc-recent-title-group">
                <span className="sc-recent-artist">{track.artist}</span>
                <button
                  className="sc-recent-title-link"
                  type="button"
                  onClick={() => handleOpenTrack(track)}
                >
                  {track.title}
                </button>
              </div>
            </div>

            <div className="sc-recent-head-meta">
              <span>{formatRelativePlayedAt(track.played_at ?? track.playedAt)}</span>
              <span
                className={`sc-recent-state-pill ${getPlaybackStateTone(track.playbackState)}`}
              >
                {getPlaybackStateLabel(
                  track.playbackState,
                  track.previewDurationSeconds,
                )}
              </span>
            </div>
          </div>

          <RecentWaveform
            track={track}
            isActive={isCurrentTrack}
            currentTime={currentTime}
            onSeek={(seconds) => handleTrackSeek(track, seconds)}
          />

          <div className="sc-recent-footer">
            <div className="sc-recent-actions">
              <button
                className={`sc-recent-surface-btn ${track.viewerHasLiked ? "is-active" : ""}`}
                type="button"
                onClick={() => handleLikeToggle(track.id)}
                aria-label={track.viewerHasLiked ? `Unlike ${track.title}` : `Like ${track.title}`}
                title={track.viewerHasLiked ? "Liked" : "Like"}
                disabled={isLikePending}
              >
                <HeartIcon />
              </button>

              <button
                className={`sc-recent-surface-btn ${
                  track.viewerHasReposted ? "is-active" : ""
                }`}
                type="button"
                onClick={() => handleRepostToggle(track.id)}
                aria-label={
                  track.viewerHasReposted
                    ? `Undo repost ${track.title}`
                    : `Repost ${track.title}`
                }
                title={track.viewerHasReposted ? "Undo repost" : "Repost"}
                disabled={isRepostPending}
              >
                <RepostIcon />
              </button>

              <button
                className="sc-recent-surface-btn"
                type="button"
                onClick={() => handleOpenTrack(track)}
                aria-label={`Open ${track.title}`}
                title="Open track"
              >
                <LinkIcon />
              </button>
            </div>

            <div className="sc-recent-stats">{renderMetricLinks(track)}</div>
          </div>
        </div>
      </article>
    );
  };

  const renderTabContent = () => {
    if (activeTab === "likes" || activeTab === "popular-tracks") {
      const isPopularTracksView = activeTab === "popular-tracks";

      return (
        <section className="library-section">
          <div className="library-section-header">
            <div>
              <h1>{isPopularTracksView ? "Popular tracks" : "Likes"}</h1>
              <p>
                {isPopularTracksView
                  ? "Tracks you liked, loaded from the backend with the same player shell."
                  : "Every track you liked, ready to play with the same recent-track shell."}
              </p>
            </div>
          </div>

          {!likedTracks.length ? (
            <div className="library-empty-panel">
              <strong>
                {isPopularTracksView
                  ? "No popular tracks yet."
                  : "No liked tracks yet."}
              </strong>
              <p>
                {isPopularTracksView
                  ? "Like a few tracks and they will show up here from your real likes feed."
                  : "Heart a few tracks and they will show up here instantly."}
              </p>
            </div>
          ) : (
            <div className="library-hero-stack">
              {likedTracks.map((track, index) =>
                renderHeroTrackCard(track, `liked-${index}`),
              )}
            </div>
          )}
        </section>
      );
    }

    if (activeTab === "reposts") {
      return (
        <section className="library-section">
          <div className="library-section-header">
            <div>
              <h1>Reposts</h1>
              <p>Tracks you reposted, loaded from the backend and ready to play.</p>
            </div>
          </div>

          {!repostedTracks.length ? (
            <div className="library-empty-panel">
              <strong>No reposted tracks yet.</strong>
              <p>Repost a track and it will appear here from your real reposts feed.</p>
            </div>
          ) : (
            <div className="library-hero-stack">
              {repostedTracks.map((track, index) =>
                renderHeroTrackCard(track, `reposted-${index}`),
              )}
            </div>
          )}
        </section>
      );
    }

    if (activeTab === "albums") {
      return <AlbumEngagementPanel />;
    }

    if (activeTab === "stations") {
      return (
        <section className="library-section">
          <div className="library-empty-panel">
            <strong>Stations are not wired into the library yet.</strong>
            <p>Open Feed to keep discovery moving until that surface is connected.</p>
            <Link to="/feed" className="library-inline-link">
              Open Feed
            </Link>
          </div>
        </section>
      );
    }

    return (
      <>
        <section className="library-section">
          <div className="library-section-header">
            <div>
              <h2>Recently played</h2>
              <p>Picked up from your latest listening session in the same order you played it.</p>
            </div>
            <Link to="/history" className="library-section-link">
              Open history
            </Link>
          </div>

          <div className="library-media-strip">
            <LibraryTile
              title={viewerProfile?.displayName ?? user?.displayName ?? "Your Library"}
              subtitle={`Made for ${viewerProfile?.displayName ?? user?.displayName ?? "you"}`}
              image={viewerProfile?.avatarUrl ?? user?.avatarUrl ?? ""}
              isProfile
              onClick={() => navigate("/profile")}
            />

            {quickRecentTracks.map((track) => (
              <LibraryTile
                key={`recent-tile-${track.id}`}
                title={track.title}
                subtitle={track.artist}
                image={track.cover}
                isActive={activeTrackId === track.id}
                onClick={() => handleOpenTrack(track)}
              />
            ))}

            {!quickRecentTracks.length
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div className="library-media-placeholder" key={`library-placeholder-${index}`} />
                ))
              : null}
          </div>
        </section>

        <section className="library-section">
          <div className="library-section-header">
            <div>
              <h2>Latest from your queue</h2>
              <p>The last track you played stays pinned here with live player progress.</p>
            </div>
          </div>

          {!activeOverviewTrack ? (
            <div className="library-empty-panel">
              <strong>Your queue is quiet right now.</strong>
              <p>Play any track and it will appear here using the recent-player layout.</p>
            </div>
          ) : (
            <div className="library-hero-stack">
              {renderHeroTrackCard(activeOverviewTrack, "overview-current")}
              {recentTracks.slice(1, 4).map((track, index) =>
                renderHeroTrackCard(track, `overview-extra-${index}`),
              )}
            </div>
          )}
        </section>

        <section className="library-section">
          <div className="library-section-header">
            <div>
              <h2>Likes</h2>
              <p>Quick access to the tracks you already liked.</p>
            </div>
            <Link to={getLibraryPathForTab("likes")} className="library-section-link">
              View all
            </Link>
          </div>

          {!likedPreviewTracks.length ? (
            <div className="library-empty-panel">
              <strong>No likes yet.</strong>
              <p>When you like tracks, they will appear here and in the Likes tab.</p>
            </div>
          ) : (
            <div className="library-media-strip">
              {likedPreviewTracks.map((track) => (
                <LibraryTile
                  key={`liked-preview-${track.id}`}
                  title={track.title}
                  subtitle={track.artist}
                  image={track.cover}
                  isActive={activeTrackId === track.id}
                  onClick={() => navigate(getLibraryPathForTab("likes"))}
                />
              ))}
            </div>
          )}
        </section>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="app-shell library-shell">
        <main className="page library-page">
          <LoadingState label="Loading your library" />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell library-shell">
      <main className="page library-page">
        <header className="library-header">
          <nav className="library-tabs" aria-label="Library tabs">
            {LIBRARY_TABS.map((tab) =>
              tab.path ? (
                <Link key={tab.label} to={tab.path} className="library-tab">
                  {tab.label}
                </Link>
              ) : (
                <Link
                  key={tab.label}
                  to={getLibraryPathForTab(tab.value)}
                  className={`library-tab ${activeTab === tab.value ? "is-active" : ""}`}
                >
                  {tab.label}
                </Link>
              ),
            )}
          </nav>
        </header>

        {errorMessage ? (
          <div className="library-empty-panel">
            <strong>Could not load your library.</strong>
            <p>{errorMessage}</p>
          </div>
        ) : (
          renderTabContent()
        )}
      </main>
    </div>
  );
}
