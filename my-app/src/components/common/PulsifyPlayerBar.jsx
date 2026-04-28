import { useEffect, useState } from "react";
import { usePlayer } from "../../hooks/usePlayer";
import { getTrack, toggleLike } from "../../services/api";
import PlayerDock from "../PlayerDock";
import "./PulsifyPlayerBar.css";

const PulsifyPlayerBar = () => {
  const {
    currentTrack,
    queueTrackIds,
    isPlaying,
    isPreparing,
    currentTime,
    duration,
    volume,
    playbackState,
    playerMessage,
    hasPrevious,
    hasNext,
    togglePlay,
    seekTo,
    setVolume,
    setQueueTrackIds,
    playPrevious,
    playNext,
    loadTrack,
    clearPlayerMessage,
    setPlayerMessage,
    syncCurrentTrack,
  } = usePlayer();
  const [queueTracks, setQueueTracks] = useState([]);
  const [pendingLikeTrackIds, setPendingLikeTrackIds] = useState({});

  useEffect(() => {
    let isCancelled = false;

    const loadQueueTracks = async () => {
      if (!queueTrackIds.length) {
        setQueueTracks(currentTrack ? [currentTrack] : []);
        return;
      }

      const results = await Promise.allSettled(
        queueTrackIds.map((trackId) => getTrack(trackId)),
      );

      if (isCancelled) return;

      setQueueTracks(
        results
          .map((result, index) => {
            const fallbackTrack =
              currentTrack?.id === queueTrackIds[index]
                ? currentTrack
                : { id: queueTrackIds[index], title: "Untitled track" };

            return result.status === "fulfilled"
              ? {
                  ...fallbackTrack,
                  ...result.value,
                }
              : fallbackTrack;
          })
          .filter((track) => track?.id),
      );
    };

    loadQueueTracks();

    return () => {
      isCancelled = true;
    };
  }, [currentTrack, queueTrackIds]);

  useEffect(() => {
    if (!currentTrack?.id) return;

    setQueueTracks((currentTracks) => {
      if (!currentTracks.length) return [currentTrack];

      return currentTracks.map((track) =>
        track.id === currentTrack.id ? { ...track, ...currentTrack } : track,
      );
    });
  }, [currentTrack]);

  const setPendingLikeState = (trackId, value) => {
    setPendingLikeTrackIds((current) => ({
      ...current,
      [trackId]: value,
    }));
  };

  const broadcastTrackLikeChange = (
    trackId,
    nextTrack,
    previousViewerHasLiked,
  ) => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("pulsify:track-engagement-updated", {
        detail: {
          trackId,
          track: nextTrack,
          viewerHasLiked: nextTrack.viewerHasLiked,
          previousViewerHasLiked,
        },
      }),
    );
  };

  const applyLocalTrackSnapshot = (trackId, snapshot) => {
    setQueueTracks((currentTracks) =>
      currentTracks.map((track) =>
        track.id === trackId
          ? {
              ...track,
              ...snapshot,
            }
          : track,
      ),
    );

    if (currentTrack?.id === trackId) {
      syncCurrentTrack(snapshot);
    }
  };

  const handleLikeTrack = async (trackInput = currentTrack) => {
    const trackId = trackInput?.id;
    if (!trackId || pendingLikeTrackIds[trackId]) return;

    const sourceTrack =
      queueTracks.find((track) => track.id === trackId) ??
      (currentTrack?.id === trackId ? currentTrack : trackInput);
    const previousViewerHasLiked = Boolean(sourceTrack?.viewerHasLiked);
    const shouldLike = !previousViewerHasLiked;
    const optimisticTrack = {
      ...sourceTrack,
      viewerHasLiked: shouldLike,
      likeCount: Math.max(
        Number(sourceTrack?.likeCount ?? 0) + (shouldLike ? 1 : -1),
        0,
      ),
    };

    setPendingLikeState(trackId, true);
    applyLocalTrackSnapshot(trackId, optimisticTrack);
    broadcastTrackLikeChange(trackId, optimisticTrack, previousViewerHasLiked);

    try {
      await toggleLike(trackId, shouldLike);
    } catch (error) {
      const rollbackTrack = {
        ...sourceTrack,
        viewerHasLiked: previousViewerHasLiked,
        likeCount: Number(sourceTrack?.likeCount ?? 0),
      };

      applyLocalTrackSnapshot(trackId, rollbackTrack);
      broadcastTrackLikeChange(trackId, rollbackTrack, shouldLike);
      setPlayerMessage?.("Could not update likes right now.");
      console.error(error);
    } finally {
      setPendingLikeState(trackId, false);
    }
  };

  const handleQueueTrackSelect = async (track) => {
    if (!track?.id) return;

    await loadTrack(track, {
      queueIds: queueTrackIds,
      playbackContext: "player_queue",
      autoplay: true,
    });
  };

  const handleClearQueue = () => {
    setQueueTrackIds(currentTrack?.id ? [currentTrack.id] : []);
  };

  return (
    <PlayerDock
      track={currentTrack}
      isPlaying={isPlaying}
      isPreparing={isPreparing}
      currentTime={currentTime}
      duration={duration}
      volume={volume}
      onTogglePlay={() => togglePlay()}
      onPreviousTrack={playPrevious}
      onNextTrack={playNext}
      onSeek={seekTo}
      onVolume={setVolume}
      playbackState={playbackState}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      message={playerMessage}
      onClearMessage={clearPlayerMessage}
      isLiked={Boolean(currentTrack?.viewerHasLiked)}
      onLikeToggle={() => handleLikeTrack(currentTrack)}
      isLikePending={Boolean(pendingLikeTrackIds[currentTrack?.id])}
      queueTracks={queueTracks}
      onQueueTrackSelect={handleQueueTrackSelect}
      onClearQueue={handleClearQueue}
      onQueueTrackLike={handleLikeTrack}
      pendingQueueLikeIds={pendingLikeTrackIds}
    />
  );
};

export default PulsifyPlayerBar;
