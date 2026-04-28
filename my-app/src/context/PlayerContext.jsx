import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getStreamUrl, getTrack, registerPlay } from "../services/api";

const PLAYER_VOLUME_KEY = "pulsify_player_volume";

const readStoredVolume = () => {
  if (typeof window === "undefined") return 70;

  const nextValue = Number(
    window.localStorage.getItem(PLAYER_VOLUME_KEY) ?? 70,
  );
  if (!Number.isNaN(nextValue)) return 70;
  return Math.min(Math.max(nextValue, 0), 100);
};

const getTrackId = (track) => {
  if (typeof track === "string") return track;

  const trackId =
    track?.trackId ??
    (typeof track?.track_id === "object"
      ? track.track_id?._id || track.track_id?.id
      : track?.track_id) ??
    track?.id ??
    track?._id ??
    "";

  return trackId ? String(trackId) : "";
};

const normalizeTrackInput = (track) => {
  if (!track) return null;

  return {
    id: getTrackId(track),
    title: track.title ?? "Untitled track",
    artist:
      track.artist?.name ??
      track.artistName ??
      track.artist ??
      track.artist_name ??
      "Unknown artist",
    artistHandle:
      track.artistHandle ?? track.artist_handle ?? track.artist?.handle ?? "",
    artistAvatar:
      track.artistAvatar ??
      track.artist_avatar ??
      track.artist?.avatarUrl ??
      track.artist?.avatar ??
      track.cover ??
      track.coverArt ??
      track.coverUrl ??
      "",
    cover:
      track.cover ??
      track.coverArt ??
      track.coverUrl ??
      track.cover_art ??
      track.cover_art_url ??
      "",
    audioUrl: track.audioUrl ?? track.audio_url ?? track.streamUrl ?? "",
    duration:
      track.duration ?? track.durationSeconds ?? track.duration_seconds ?? 0,
    playCount: track.playCount ?? track.play_count ?? track.plays ?? 0,
    likeCount: track.likeCount ?? track.like_count ?? track.likes ?? 0,
    repostCount: track.repostCount ?? track.repost_count ?? track.reposts ?? 0,
    commentCount:
      track.commentCount ??
      track.comment_count ??
      track.comments ??
      track.commentsCount ??
      0,
    viewerHasLiked: Boolean(track.viewerHasLiked ?? track.viewer_has_liked),
    viewerHasReposted: Boolean(
      track.viewerHasReposted ?? track.viewer_has_reposted,
    ),
    playbackState: track.playbackState ?? track.playback_state ?? "Playable",
    previewStartSeconds:
      track.previewStartSeconds ?? track.preview_start_seconds ?? 0,
    previewDurationSeconds:
      track.previewDurationSeconds ?? track.preview_duration_seconds ?? 0,
    typeLabel: track.typeLabel ?? "Music",
  };
};

const buildBlockedStreamInfo = (track, message) => ({
  url: "",
  playback_state: "Blocked",
  preview_start_seconds: 0,
  preview_duration_seconds: 0,
  message: message ?? "This track is blocked for your plan or region.",
});

const buildFallbackStreamInfo = (track, playbackContext = "track_page") => {
  const normalizedTrack = normalizeTrackInput(track);
  const state = normalizedTrack?.playbackState ?? "Playable";
  const contextKey = String(playbackContext ?? "").toLowerCase();
  const discoveryLikeContext =
    contextKey === "discovery" || contextKey === "feed";
  const previewDurationSeconds =
    normalizedTrack?.previewDurationSeconds ?? (discoveryLikeContext ? 30 : 0);

  if (state === "Blocked") {
    return buildBlockedStreamInfo(track);
  }

  return {
    url: normalizedTrack?.audioUrl ?? "",
    playback_state:
      discoveryLikeContext && previewDurationSeconds ? "Preview" : state,
    preview_start_seconds: normalizedTrack?.previewStartSeconds ?? 0,
    preview_duration_seconds:
      discoveryLikeContext || state === "Preview" ? previewDurationSeconds : 0,
    message: null,
  };
};

// A "full" track object is one that was already fetched from the API —
// it will have at minimum a title and a duration. If those are present we
// skip the redundant getTrack() call inside resolveTrack.
const isFullTrackObject = (track) =>
  track != null &&
  typeof track === "object" &&
  Boolean(track.title) &&
  (track.duration != null ||
    track.durationSeconds != null ||
    track.duration_seconds != null);

const dedupeQueue = (trackIds = []) => [
  ...new Set(trackIds.filter(Boolean).map((trackId) => String(trackId))),
];

export const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const audioRef = useRef(null);
  const loadRequestRef = useRef(0);
  const sessionReportedRef = useRef(false);
  const skipPauseReportRef = useRef(false);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [queueTrackIds, setQueueTrackIdsState] = useState([]);
  const [streamInfo, setStreamInfo] = useState(null);
  const [playbackContext, setPlaybackContext] = useState("track_page");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(readStoredVolume);
  const [playerMessage, setPlayerMessage] = useState("");
  const [isPreparing, setIsPreparing] = useState(false);
  const [pendingAutoplay, setPendingAutoplay] = useState({
    shouldAutoplay: false,
    trackId: "",
    startTime: 0,
    previewMessage: "",
  });

  const playbackState =
    streamInfo?.playback_state ?? currentTrack?.playbackState ?? "Playable";
  const previewStartSeconds =
    streamInfo?.preview_start_seconds ?? currentTrack?.previewStartSeconds ?? 0;
  const previewDurationSeconds =
    streamInfo?.preview_duration_seconds ??
    currentTrack?.previewDurationSeconds ??
    0;
  const previewEndSeconds =
    playbackState === "Preview" && previewDurationSeconds
      ? previewStartSeconds + previewDurationSeconds
      : 0;
  const audioSource = streamInfo?.url || currentTrack?.audioUrl || "";

  const currentTrackIndex = useMemo(
    () => queueTrackIds.findIndex((trackId) => trackId === currentTrack?.id),
    [currentTrack?.id, queueTrackIds],
  );

  const hasPrevious = currentTrackIndex >= 0 && queueTrackIds.length > 1;
  const hasNext = currentTrackIndex >= 0 && queueTrackIds.length > 1;

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PLAYER_VOLUME_KEY, String(volume));
  }, [volume]);

  useEffect(() => {
    if (!currentTrack?.id) return;

    setQueueTrackIdsState((currentQueue) => {
      if (currentQueue.includes(currentTrack.id)) return currentQueue;
      return dedupeQueue([...currentQueue, currentTrack.id]);
    });
  }, [currentTrack?.id]);

  useEffect(() => {
    if (
      !pendingAutoplay.shouldAutoplay ||
      !audioRef.current ||
      !currentTrack?.id ||
      pendingAutoplay.trackId !== currentTrack.id ||
      !audioSource
    ) {
      return undefined;
    }

    let cancelled = false;

    const startPlayback = async () => {
      try {
        audioRef.current.currentTime = pendingAutoplay.startTime;
        setCurrentTime(pendingAutoplay.startTime);
        await audioRef.current.play();

        if (cancelled) return;

        setIsPlaying(true);
        setPlayerMessage(pendingAutoplay.previewMessage);
      } catch (error) {
        if (cancelled) return;
        setPlayerMessage("Audio playback could not start.");
        console.error(error);
      } finally {
        if (!cancelled) {
          setPendingAutoplay((currentValue) => ({
            ...currentValue,
            shouldAutoplay: false,
          }));
          setIsPreparing(false);
        }
      }
    };

    startPlayback();

    return () => {
      cancelled = true;
    };
  }, [audioSource, currentTrack?.id, pendingAutoplay]);

  const submitPlayEvent = useCallback(async () => {
    if (!currentTrack) return;

    const playedMs = Math.round(
      (audioRef.current?.currentTime ?? currentTime) * 1000,
    );

    if (playedMs < 5000 || sessionReportedRef.current) {
      return;
    }

    sessionReportedRef.current = true;

    try {
      const playResult = await registerPlay(currentTrack.id, {
        duration_played_ms: playedMs,
      });

      if (playResult?.counted ?? true) {
        setCurrentTrack((activeTrack) =>
          activeTrack
            ? {
                ...activeTrack,
                playCount: (activeTrack.playCount ?? 0) + 1,
              }
            : activeTrack,
        );
      }
    } catch (error) {
      sessionReportedRef.current = false;
      console.error(error);
    }
  }, [currentTime, currentTrack]);

  // FIX 1: Skip the redundant getTrack() API call when the caller already
  // passed in a full track object (i.e. TrackPage already fetched it).
  // We only hit the API when given a bare track ID string, or a minimal
  // stub that is missing required fields like title/duration.
  const resolveTrack = useCallback(async (trackInput) => {
    if (!trackInput) return null;

    // Bare ID string — must fetch.
    if (typeof trackInput === "string") {
      try {
        return await getTrack(trackInput);
      } catch (error) {
        console.warn(`Track not found on backend: ${trackInput}`, error);
        return null;
      }
    }

    const normalizedTrack = normalizeTrackInput(trackInput);
    if (!normalizedTrack?.id) {
      return normalizedTrack;
    }

    // Full object already — no need to re-fetch from the API.
    if (isFullTrackObject(trackInput)) {
      return normalizedTrack;
    }

    // Partial / stub object — fill in the gaps from the API.
    try {
      const trackDetails = await getTrack(normalizedTrack.id);
      return {
        ...normalizedTrack,
        ...trackDetails,
      };
    } catch {
      return normalizedTrack;
    }
  }, []);

  const resolveStreamInfo = useCallback(async (track, nextPlaybackContext) => {
    if (!track) return buildFallbackStreamInfo(track, nextPlaybackContext);

    if (!track.id) {
      return buildFallbackStreamInfo(track, nextPlaybackContext);
    }

    try {
      return await getStreamUrl(track.id, {
        playbackContext: nextPlaybackContext,
      });
    } catch (error) {
      if (error?.status === 403) {
        return buildBlockedStreamInfo(track, error?.message);
      }

      if (error?.status === 404) {
        console.warn(`Track not found on backend: ${track.id}`);
        return buildFallbackStreamInfo(track, nextPlaybackContext);
      }

      console.error(error);
      return buildFallbackStreamInfo(track, nextPlaybackContext);
    }
  }, []);

  const loadTrack = useCallback(
    async (trackInput, options = {}) => {
      if (!trackInput) return null;

      const nextQueueIds = options.queueIds
        ? dedupeQueue(options.queueIds)
        : queueTrackIds;
      const nextPlaybackContext = options.playbackContext ?? playbackContext;
      const nextRequestId = loadRequestRef.current + 1;

      loadRequestRef.current = nextRequestId;
      setIsPreparing(true);
      setPlayerMessage("");

      if (nextQueueIds.length) {
        setQueueTrackIdsState(nextQueueIds);
      }

      let resolvedTrack = null;
      try {
        resolvedTrack = await resolveTrack(trackInput);
      } catch (error) {
        console.error(error);
      }

      if (!resolvedTrack) {
        setIsPreparing(false);
        setPlayerMessage("Track unavailable right now.");
        return null;
      }

      skipPauseReportRef.current = false;
      if (audioRef.current) {
        skipPauseReportRef.current = !audioRef.current.paused;
        if (!audioRef.current.paused) {
          audioRef.current.pause();
        }
        audioRef.current.currentTime = 0;
      }

      const nextStreamInfo = await resolveStreamInfo(
        resolvedTrack,
        nextPlaybackContext,
      );
      if (loadRequestRef.current !== nextRequestId) {
        return resolvedTrack;
      }

      const nextPlaybackState =
        nextStreamInfo?.playback_state ??
        resolvedTrack.playbackState ??
        "Playable";
      const nextPreviewDuration =
        nextStreamInfo?.preview_duration_seconds ??
        resolvedTrack.previewDurationSeconds ??
        0;
      const initialTime =
        typeof options.startTime === "number"
          ? options.startTime
          : nextPlaybackState === "Preview" && nextPreviewDuration
            ? (nextStreamInfo?.preview_start_seconds ??
              resolvedTrack.previewStartSeconds ??
              0)
            : 0;

      sessionReportedRef.current = false;
      setPlaybackContext(nextPlaybackContext);
      setCurrentTrack(resolvedTrack);
      setStreamInfo(nextStreamInfo);
      setCurrentTime(initialTime);
      setDuration(resolvedTrack.duration ?? 0);
      setIsPlaying(false);

      if (nextPlaybackState === "Blocked") {
        setPendingAutoplay({
          shouldAutoplay: false,
          trackId: resolvedTrack.id,
          startTime: 0,
          previewMessage: "",
        });
        setIsPreparing(false);
        setPlayerMessage(
          nextStreamInfo?.message ??
            "This track is blocked because of plan or region rules.",
        );
        return resolvedTrack;
      }

      if (!nextStreamInfo?.url && !resolvedTrack.audioUrl) {
        setPendingAutoplay({
          shouldAutoplay: false,
          trackId: resolvedTrack.id,
          startTime: 0,
          previewMessage: "",
        });
        setIsPreparing(false);
        setPlayerMessage("Track audio unavailable right now.");
        return resolvedTrack;
      }

      setPendingAutoplay({
        shouldAutoplay: options.autoplay ?? true,
        trackId: resolvedTrack.id,
        startTime: initialTime,
        previewMessage:
          nextPlaybackState === "Preview" && nextPreviewDuration
            ? `Preview access active for ${nextPreviewDuration} seconds.`
            : "",
      });

      if (!(options.autoplay ?? true)) {
        setIsPreparing(false);
      }

      return resolvedTrack;
    },
    [playbackContext, queueTrackIds, resolveStreamInfo, resolveTrack],
  );

  const togglePlay = useCallback(
    async (trackInput = null, options = {}) => {
      const requestedTrackId = getTrackId(trackInput);

      if (
        trackInput &&
        requestedTrackId &&
        currentTrack?.id &&
        requestedTrackId !== currentTrack.id
      ) {
        await loadTrack(trackInput, {
          ...options,
          autoplay: true,
        });
        return;
      }

      if (trackInput && !currentTrack?.id) {
        await loadTrack(trackInput, {
          ...options,
          autoplay: true,
        });
        return;
      }

      if (!currentTrack || !audioRef.current) return;

      if (isPlaying) {
        audioRef.current.pause();
        return;
      }

      const nextPlaybackState =
        streamInfo?.playback_state ?? currentTrack.playbackState ?? "Playable";

      if (nextPlaybackState === "Blocked") {
        setPlayerMessage("Playback is blocked for this account or region.");
        return;
      }

      const resumeTime =
        nextPlaybackState === "Preview" && previewDurationSeconds
          ? currentTime >= previewEndSeconds ||
            currentTime < previewStartSeconds
            ? previewStartSeconds
            : currentTime
          : currentTime;

      setPendingAutoplay({
        shouldAutoplay: true,
        trackId: currentTrack.id,
        startTime: resumeTime,
        previewMessage:
          nextPlaybackState === "Preview" && previewDurationSeconds
            ? `Preview access active for ${previewDurationSeconds} seconds.`
            : "",
      });
    },
    [
      currentTime,
      currentTrack,
      isPlaying,
      loadTrack,
      previewDurationSeconds,
      previewEndSeconds,
      previewStartSeconds,
      streamInfo?.playback_state,
    ],
  );

  const seekTo = useCallback(
    (nextValue) => {
      if (!audioRef.current) return;

      if (playbackState === "Blocked") {
        setPlayerMessage("Playback is blocked for this account or region.");
        return;
      }

      const targetTime =
        playbackState === "Preview" && previewDurationSeconds
          ? Math.min(
              Math.max(nextValue, previewStartSeconds),
              previewEndSeconds,
            )
          : nextValue;

      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    },
    [
      playbackState,
      previewDurationSeconds,
      previewEndSeconds,
      previewStartSeconds,
    ],
  );

  const setVolume = useCallback((nextValue) => {
    setVolumeState(Math.min(Math.max(Number(nextValue) || 0, 0), 100));
  }, []);

  const playRelativeTrack = useCallback(
    async (direction) => {
      if (!queueTrackIds.length || currentTrackIndex < 0) return;

      const nextIndex =
        direction === "previous"
          ? (currentTrackIndex - 1 + queueTrackIds.length) %
            queueTrackIds.length
          : (currentTrackIndex + 1) % queueTrackIds.length;

      await loadTrack(queueTrackIds[nextIndex], {
        queueIds: queueTrackIds,
        playbackContext,
        autoplay: true,
      });
    },
    [currentTrackIndex, loadTrack, playbackContext, queueTrackIds],
  );

  const playPrevious = useCallback(async () => {
    await playRelativeTrack("previous");
  }, [playRelativeTrack]);

  const playNext = useCallback(async () => {
    await playRelativeTrack("next");
  }, [playRelativeTrack]);

  const syncCurrentTrack = useCallback((trackInput) => {
    const normalizedTrack = normalizeTrackInput(trackInput);
    if (!normalizedTrack?.id) return;

    setCurrentTrack((activeTrack) => {
      if (!activeTrack || normalizedTrack.id !== activeTrack.id) {
        return activeTrack;
      }

      const nextTrack = {
        ...activeTrack,
        ...normalizedTrack,
      };
      const hasChanges = Object.keys(normalizedTrack).some(
        (key) => nextTrack[key] !== activeTrack[key],
      );

      return hasChanges ? nextTrack : activeTrack;
    });
  }, []);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;

    const nextTime = audioRef.current.currentTime;

    if (
      playbackState === "Preview" &&
      previewDurationSeconds &&
      nextTime >= previewEndSeconds
    ) {
      audioRef.current.currentTime = previewEndSeconds;
      audioRef.current.pause();
      setCurrentTime(previewEndSeconds);
      setIsPlaying(false);
      setPlayerMessage(
        `Preview ended at ${Math.floor(previewEndSeconds)} seconds.`,
      );
      return;
    }

    setCurrentTime(nextTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;

    if (!Number.isNaN(audioRef.current.duration)) {
      setDuration(Math.floor(audioRef.current.duration));
    }
  };

  const handlePause = async () => {
    setIsPlaying(false);

    if (skipPauseReportRef.current) {
      skipPauseReportRef.current = false;
      return;
    }

    await submitPlayEvent();
  };

  const handleEnded = async () => {
    setIsPlaying(false);
    await submitPlayEvent();
  };

  const setQueueTrackIds = useCallback(
    (trackIds) => setQueueTrackIdsState(dedupeQueue(trackIds)),
    [],
  );

  const clearPlayerMessage = useCallback(() => setPlayerMessage(""), []);

  const playerProgress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const playerCurrentTime = currentTime;

  const contextValue = useMemo(
    () => ({
      currentTrack,
      queueTrackIds,
      isPlaying,
      currentTime,
      duration,
      volume,
      playbackState,
      previewStartSeconds,
      previewDurationSeconds,
      previewEndSeconds,
      playerMessage,
      isPreparing,
      hasPrevious,
      hasNext,
      playerProgress,
      playerCurrentTime,
      loadTrack,
      togglePlay,
      seekTo,
      setVolume,
      setQueueTrackIds,
      playPrevious,
      playNext,
      clearPlayerMessage,
      setPlayerMessage,
      syncCurrentTrack,
    }),
    [
      clearPlayerMessage,
      currentTime,
      currentTrack,
      duration,
      hasNext,
      hasPrevious,
      isPlaying,
      isPreparing,
      loadTrack,
      playNext,
      playPrevious,
      playbackState,
      playerCurrentTime,
      playerMessage,
      playerProgress,
      previewDurationSeconds,
      previewEndSeconds,
      previewStartSeconds,
      queueTrackIds,
      seekTo,
      setQueueTrackIds,
      setVolume,
      syncCurrentTrack,
      togglePlay,
      volume,
    ],
  );

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
      <audio
        ref={audioRef}
        src={audioSource || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPause={handlePause}
        onEnded={handleEnded}
      />
    </PlayerContext.Provider>
  );
};
