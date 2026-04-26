import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Comments from "../components/Comments";
import EngagementListModal from "../components/EngagementListModal";
import HistoryPanel from "../components/HistoryPanel";
import LoadingState from "../components/LoadingState";
import PlayerCard from "../components/PlayerCard";
import TrackHeader from "../components/TrackHeader";
import { DEFAULT_TRACK_ID } from "../config/defaultTrack";
import { usePlayer } from "../hooks/usePlayer";
import { trackExperienceMockData } from "../mock/trackExperienceData";
import {
  clearAuthToken,
  createComment,
  deleteComment,
  getDownloadUrl,
  getCommentReplies,
  getComments,
  getFanLeaderboard,
  hasAuthToken,
  getLikers,
  getRelatedTracks,
  getReposters,
  readAuthToken,
  saveAuthToken,
  getStreamUrl,
  getTrack,
  getTrackPlaylists,
  toggleLike,
  toggleRepost,
} from "../services/api";
import "../App.css";

const mockTrackOrder = Object.keys(trackExperienceMockData.tracks);
const configuredApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || "your configured API";

const sanitizeFilenamePart = (value) =>
  String(value ?? "")
    .split("")
    .filter((character) => {
      const characterCode = character.charCodeAt(0);
      return characterCode >= 32 && !'<>:"/\\|?*'.includes(character);
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();

const inferDownloadExtension = (url, mimeType) => {
  if (mimeType?.includes("mpeg")) return "mp3";
  if (mimeType?.includes("wav")) return "wav";
  if (mimeType?.includes("ogg")) return "ogg";
  if (mimeType?.includes("aac")) return "aac";
  if (mimeType?.includes("mp4")) return "m4a";

  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-z0-9]{2,5})$/i);
    return match?.[1]?.toLowerCase() ?? "mp3";
  } catch {
    return "mp3";
  }
};

const sortCommentsByTimeline = (items) =>
  [...items].sort((left, right) => {
    const leftTime = left.timestamp_ms ?? Number.MAX_SAFE_INTEGER;
    const rightTime = right.timestamp_ms ?? Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  });

const mergeById = (items) => {
  const itemMap = new Map();

  items.forEach((item) => {
    if (item?.id) {
      itemMap.set(item.id, item);
    }
  });

  return [...itemMap.values()];
};

const COMMENTS_PAGE_LIMIT = 20;
const REPLIES_PAGE_LIMIT = 20;

const markCommentAsDeleted = (comment) => ({
  ...comment,
  text: "Comment deleted.",
  isDeleted: true,
});

const getSectionConfig = (
  view,
  track,
  relatedTracks,
  playlists,
  likers,
  reposters
) => {
  if (!track) return null;

  if (view === "related") {
    return {
      title: "Related tracks",
      description: `Tracks that sit naturally next to ${track.title}.`,
      variant: "tracks",
      items: relatedTracks,
    };
  }

  if (view === "playlists") {
    return {
      title: "In playlists",
      description: "Curated playlists where this track already appears.",
      variant: "playlists",
      items: playlists,
    };
  }

  if (view === "likes") {
    return {
      title: "Likes",
      description: "Listeners who favorited this track.",
      variant: "users",
      items: likers,
    };
  }

  if (view === "reposts") {
    return {
      title: "Reposts",
      description: "Listeners who pushed this track into their feed.",
      variant: "users",
      items: reposters,
    };
  }

  return null;
};

function TrackPage({ view = "overview" }) {
  const navigate = useNavigate();
  const { trackId: routeTrackId } = useParams();
  const trackId = routeTrackId ?? DEFAULT_TRACK_ID;
  const {
    currentTrack: activeTrack,
    isPlaying: playerIsPlaying,
    currentTime: playerCurrentTime,
    duration: playerDuration,
    playbackState: playerPlaybackState,
    playerMessage,
    setPlayerMessage,
    togglePlay,
    loadTrack,
    seekTo,
    setQueueTrackIds,
    syncCurrentTrack,
  } = usePlayer();

  const [authRefreshKey, setAuthRefreshKey] = useState(0);
  const [tokenInput, setTokenInput] = useState(() => readAuthToken());
  const [track, setTrack] = useState(null);
  const [streamInfo, setStreamInfo] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentsPagination, setCommentsPagination] = useState(null);
  const [relatedTracks, setRelatedTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [fanLeaderboard, setFanLeaderboard] = useState([]);
  const [likers, setLikers] = useState([]);
  const [reposters, setReposters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [uiMessage, setUiMessage] = useState("");
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  const isTrackIdMissing = !trackId;
  const isActiveRouteTrack = Boolean(track?.id) && activeTrack?.id === track.id;

  const playbackState =
    isActiveRouteTrack
      ? playerPlaybackState
      : streamInfo?.playback_state ?? track?.playbackState ?? "Playable";
  const previewDurationSeconds =
    streamInfo?.preview_duration_seconds ?? track?.previewDurationSeconds ?? 0;
  const currentTime = isActiveRouteTrack ? playerCurrentTime : 0;
  const duration = isActiveRouteTrack
    ? playerDuration || track?.duration || 0
    : track?.duration || 0;
  const isPlaying = isActiveRouteTrack ? playerIsPlaying : false;
  const feedbackMessage = isActiveRouteTrack ? playerMessage || uiMessage : uiMessage || playerMessage;

  const visibleComments = useMemo(
    () => (view === "overview" ? comments.slice(0, 6) : comments),
    [comments, view]
  );

  const sectionConfig = useMemo(
    () =>
      getSectionConfig(
        view,
        track,
        relatedTracks,
        playlists,
        likers,
        reposters
      ),
    [view, track, relatedTracks, playlists, likers, reposters]
  );

  useEffect(() => {
    if (!activeTrack?.id || !routeTrackId || activeTrack.id === routeTrackId) {
      return;
    }

    navigate(
      view === "overview"
        ? `/tracks/${activeTrack.id}`
        : `/tracks/${activeTrack.id}/${view}`,
    );
  }, [activeTrack?.id, navigate, routeTrackId, view]);

  useEffect(() => {
    const handleTrackEngagementUpdate = (event) => {
      const { trackId: updatedTrackId, track: updatedTrack } = event.detail ?? {};

      if (!updatedTrackId || updatedTrackId !== trackId || !updatedTrack) return;

      setTrack((currentTrack) =>
        currentTrack
          ? {
              ...currentTrack,
              ...updatedTrack,
            }
          : currentTrack
      );
    };

    window.addEventListener(
      "pulsify:track-engagement-updated",
      handleTrackEngagementUpdate
    );

    return () => {
      window.removeEventListener(
        "pulsify:track-engagement-updated",
        handleTrackEngagementUpdate
      );
    };
  }, [trackId]);

  const isAuthError =
    error.startsWith("Missing access token.") ||
    error.startsWith("Unauthorized.");

  useEffect(() => {
    if (!trackId) {
      setIsLoading(false);
      setError("");
      return;
    }

    let isMounted = true;

    const loadTrack = async () => {
      setIsLoading(true);
      setError("");
      setUiMessage(
        hasAuthToken()
          ? ""
          : "Demo mode active. Add a backend token any time to use live data."
      );
      setCommentTotal(0);
      setCommentsPagination(null);

      if (!isMounted) return;

      let nextTrack = null;

      try {
        nextTrack = await getTrack(trackId);
      } catch {
        setError("Track unavailable right now.");
        setIsLoading(false);
        return;
      }

      const results = await Promise.allSettled([
        getStreamUrl(trackId, { playbackContext: "track_page" }),
        getComments(trackId, { page: 1, limit: COMMENTS_PAGE_LIMIT }),
        getLikers(trackId),
        getReposters(trackId),
        getRelatedTracks(trackId),
        getTrackPlaylists(trackId),
        getFanLeaderboard(trackId),
      ]);

      if (!isMounted) return;

      setTrack(nextTrack);
      setStreamInfo(
        results[0].status === "fulfilled"
          ? results[0].value
          : results[0].reason?.status === 403
          ? {
              url: "",
              playback_state: "Blocked",
              preview_start_seconds: 0,
              preview_duration_seconds: 0,
              message:
                results[0].reason?.message ??
                "This track is blocked for your plan or region.",
            }
          : {
              url: nextTrack.audioUrl,
              playback_state: nextTrack.playbackState,
              preview_start_seconds: 0,
              preview_duration_seconds: nextTrack.previewDurationSeconds,
            }
      );

      const commentsPayload =
        results[1].status === "fulfilled"
          ? results[1].value
          : {
              comments: [],
              totalCount: nextTrack.commentCount ?? 0,
              pagination: {
                page: 1,
                limit: COMMENTS_PAGE_LIMIT,
                total: nextTrack.commentCount ?? 0,
                pages: 1,
              },
            };

      setComments(sortCommentsByTimeline(commentsPayload.comments));
      setCommentTotal(commentsPayload.totalCount ?? nextTrack.commentCount ?? 0);
      setCommentsPagination(commentsPayload.pagination ?? null);
      setLikers(results[2].status === "fulfilled" ? results[2].value : []);
      setReposters(results[3].status === "fulfilled" ? results[3].value : []);
      setRelatedTracks(results[4].status === "fulfilled" ? results[4].value : []);
      setPlaylists(results[5].status === "fulfilled" ? results[5].value : []);
      setFanLeaderboard(
        results[6].status === "fulfilled" ? results[6].value : []
      );
      setQueueTrackIds(mockTrackOrder);
      syncCurrentTrack(nextTrack);
      setIsLoading(false);
    };

    loadTrack();

    return () => {
      isMounted = false;
    };
  }, [authRefreshKey, setQueueTrackIds, syncCurrentTrack, trackId]);

  useEffect(() => {
    if (!track || !isActiveRouteTrack) return;
    syncCurrentTrack(track);
  }, [isActiveRouteTrack, syncCurrentTrack, track]);

  const handleTokenSubmit = (event) => {
    event.preventDefault();

    const normalizedToken = tokenInput.trim();
    if (!normalizedToken) {
      setError("Enter a token first.");
      return;
    }

    saveAuthToken(normalizedToken);
    setError("");
    setAuthRefreshKey((currentValue) => currentValue + 1);
  };

  const handleClearToken = () => {
    clearAuthToken();
    setTokenInput("");
    setTrack(null);
    setStreamInfo(null);
    setComments([]);
    setCommentTotal(0);
    setCommentsPagination(null);
    setRelatedTracks([]);
    setPlaylists([]);
    setFanLeaderboard([]);
    setLikers([]);
    setReposters([]);
    setError(
      "Missing access token. Add a valid token in localStorage as `accessToken` or `pulsify_token`, then reload."
    );
  };

  const handleSeek = (nextValue) => {
    if (playbackState === "Blocked") {
      setPlayerMessage("Playback is blocked for this account or region.");
      return;
    }

    if (isActiveRouteTrack) {
      seekTo(nextValue);
      return;
    }

    loadTrack(track, {
      autoplay: false,
      playbackContext: "track_page",
      queueIds: mockTrackOrder,
      startTime: nextValue,
    });
  };

  const handleTogglePlay = async () => {
    if (!track) return;

    if (playbackState === "Blocked") {
      setPlayerMessage(
        "This track is blocked because of plan or region rules."
      );
      return;
    }

    if (isActiveRouteTrack) {
      await togglePlay();
      return;
    }

    await loadTrack(track, {
      autoplay: true,
      playbackContext: "track_page",
      queueIds: mockTrackOrder,
    });
  };

  const handleLikeToggle = async () => {
    if (!track) return;

    const previousViewerHasLiked = Boolean(track.viewerHasLiked);
    const shouldLike = !track.viewerHasLiked;
    const optimisticTrack = {
      ...track,
      viewerHasLiked: shouldLike,
      likeCount: Math.max(track.likeCount + (shouldLike ? 1 : -1), 0),
    };

    setTrack(optimisticTrack);
    syncCurrentTrack(optimisticTrack);
    window.dispatchEvent(
      new CustomEvent("pulsify:track-engagement-updated", {
        detail: {
          trackId: track.id,
          track: optimisticTrack,
          viewerHasLiked: shouldLike,
          previousViewerHasLiked,
        },
      })
    );

    try {
      await toggleLike(track.id, shouldLike);
      setLikers(await getLikers(track.id));
    } catch (toggleError) {
      const rollbackTrack = {
        ...track,
        viewerHasLiked: previousViewerHasLiked,
        likeCount: track.likeCount,
      };

      setTrack(rollbackTrack);
      syncCurrentTrack(rollbackTrack);
      window.dispatchEvent(
        new CustomEvent("pulsify:track-engagement-updated", {
          detail: {
            trackId: track.id,
            track: rollbackTrack,
            viewerHasLiked: previousViewerHasLiked,
            previousViewerHasLiked: shouldLike,
          },
        })
      );
      console.error(toggleError);
    }
  };

  const handleRepostToggle = async () => {
    if (!track) return;

    const shouldRepost = !track.viewerHasReposted;

    setTrack((currentTrack) => ({
      ...currentTrack,
      viewerHasReposted: shouldRepost,
      repostCount: Math.max(
        currentTrack.repostCount + (shouldRepost ? 1 : -1),
        0
      ),
    }));

    try {
      await toggleRepost(track.id, shouldRepost);
      setReposters(await getReposters(track.id));
    } catch (toggleError) {
      setTrack((currentTrack) => ({
        ...currentTrack,
        viewerHasReposted: !shouldRepost,
        repostCount: Math.max(
          currentTrack.repostCount + (shouldRepost ? -1 : 1),
          0
        ),
      }));
      console.error(toggleError);
    }
  };

  const handleAddComment = async (payload) => {
    if (!track) return;

    const comment = await createComment(track.id, payload);
    setComments((currentComments) =>
      sortCommentsByTimeline([...currentComments, comment])
    );
    setCommentTotal((currentTotal) => currentTotal + 1);
    setTrack((currentTrack) => ({
      ...currentTrack,
      commentCount: currentTrack.commentCount + 1,
    }));
    setCommentsPagination((currentPagination) =>
      currentPagination
        ? {
            ...currentPagination,
            total: (currentPagination.total ?? 0) + 1,
            pages: Math.max(
              currentPagination.pages ?? 1,
              Math.ceil(((currentPagination.total ?? 0) + 1) / Math.max(currentPagination.limit ?? COMMENTS_PAGE_LIMIT, 1))
            ),
          }
        : currentPagination
    );
  };

  const handleAddReply = async (parentCommentId, payload) => {
    if (!track) return null;

    const reply = await createComment(track.id, {
      ...payload,
      parentCommentId,
    });

    setComments((currentComments) =>
      currentComments.map((comment) =>
        comment.id === parentCommentId
          ? {
              ...comment,
              repliesCount: (comment.repliesCount ?? 0) + 1,
            }
          : comment
      )
    );
    setCommentTotal((currentTotal) => currentTotal + 1);
    setTrack((currentTrack) => ({
      ...currentTrack,
      commentCount: currentTrack.commentCount + 1,
    }));
    setCommentsPagination((currentPagination) =>
      currentPagination
        ? {
            ...currentPagination,
            total: (currentPagination.total ?? 0) + 1,
            pages: Math.max(
              currentPagination.pages ?? 1,
              Math.ceil(((currentPagination.total ?? 0) + 1) / Math.max(currentPagination.limit ?? COMMENTS_PAGE_LIMIT, 1))
            ),
          }
        : currentPagination
    );

    return reply;
  };

  const handleLoadReplies = async (commentId, options = {}) => {
    return getCommentReplies(commentId, {
      page: options.page ?? 1,
      limit: options.limit ?? REPLIES_PAGE_LIMIT,
    });
  };

  const handleLoadMoreComments = async () => {
    if (!commentsPagination || isLoadingMoreComments || !track) return;

    const currentPage = commentsPagination.page ?? 1;
    const totalPages = commentsPagination.pages ?? 1;
    if (currentPage >= totalPages) return;

    setIsLoadingMoreComments(true);

    try {
      const nextPayload = await getComments(track.id, {
        page: currentPage + 1,
        limit: commentsPagination.limit ?? COMMENTS_PAGE_LIMIT,
      });

      setComments((currentComments) =>
        sortCommentsByTimeline(
          mergeById([...currentComments, ...(nextPayload.comments ?? [])])
        )
      );
      setCommentTotal((currentTotal) =>
        nextPayload.totalCount ?? commentsPagination.total ?? currentTotal
      );
      setCommentsPagination(nextPayload.pagination ?? commentsPagination);
    } catch (loadMoreError) {
      setPlayerMessage(loadMoreError?.message || "Could not load more comments.");
    } finally {
      setIsLoadingMoreComments(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    await deleteComment(commentId);
    setComments((currentComments) =>
      currentComments.map((comment) =>
        comment.id === commentId ? markCommentAsDeleted(comment) : comment
      )
    );
    setPlayerMessage("Comment deleted successfully.");
  };

  const copyShareLink = async (url, successMessage) => {
    if (!navigator?.clipboard?.writeText) {
      setPlayerMessage("Copy is not supported in this browser.");
      return false;
    }

    try {
      await navigator.clipboard.writeText(url);
      setPlayerMessage(successMessage);
      return true;
    } catch (copyError) {
      setPlayerMessage("Could not copy the track link.");
      console.error(copyError);
      return false;
    }
  };

  const handleShare = async () => {
    if (!track || typeof window === "undefined") return;

    const shareUrl = window.location.href;

    if (navigator?.share) {
      try {
        await navigator.share({
          title: `${track.title} - ${track.artist}`,
          text: `Listen to ${track.title} by ${track.artist}`,
          url: shareUrl,
        });
        setPlayerMessage("Share sheet opened.");
        return;
      } catch (shareError) {
        if (shareError?.name === "AbortError") {
          return;
        }
      }
    }

    await copyShareLink(shareUrl, "Track link copied.");
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return;
    await copyShareLink(window.location.href, "Track link copied.");
  };

  const handleDownload = async () => {
    if (!track || typeof document === "undefined") return;

    const sourceUrl = streamInfo?.url ?? track.audioUrl;
    if (!sourceUrl) {
      setPlayerMessage("Download is not available for this track.");
      return;
    }

    const baseName =
      sanitizeFilenamePart(`${track.artist} - ${track.title}`) || "track";
    setIsDownloading(true);
    setPlayerMessage("");

    try {
      const downloadInfo = await getDownloadUrl(track.id);
      const downloadUrl = downloadInfo?.url ?? sourceUrl;

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      const blob = await response.blob();
      const extension = inferDownloadExtension(downloadUrl, blob.type);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = `${baseName}.${extension}`;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setPlayerMessage("Download started. Check your Downloads folder.");
    } catch (downloadError) {
      console.error(downloadError);

      if (downloadError?.status === 403) {
        setPlayerMessage(
          downloadError.message ||
            "Download is only available on the ArtistPro plan."
        );
        return;
      }

      try {
        const fallbackLink = document.createElement("a");
        fallbackLink.href = sourceUrl;
        fallbackLink.download = `${baseName}.mp3`;
        fallbackLink.target = "_blank";
        fallbackLink.rel = "noreferrer";
        fallbackLink.style.display = "none";

        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        fallbackLink.remove();

        setPlayerMessage(
          "Download was triggered. If it did not save, allow downloads in your browser."
        );
      } catch (fallbackError) {
        console.error(fallbackError);
        setPlayerMessage("Could not download this track right now.");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-shell">
        <LoadingState label="Loading track experience" />
      </div>
    );
  }

  if (isTrackIdMissing) {
    return (
      <div className="app-shell">
        <main className="page">
          <section className="auth-token-panel">
            <div className="auth-token-copy">
              <span className="tag">Track configuration</span>
              <h1>Set a real backend track id</h1>
              <p>
                The app is now pointed to
                {" "}<code>{configuredApiBaseUrl}</code>, but no live track id is
                configured yet.
                Add <code>VITE_TRACK_ID</code> in <code>.env</code> or open a route like
                <code> /tracks/&lt;your-track-id&gt;</code>.
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!track || error) {
    if (isAuthError) {
      return (
        <div className="app-shell">
          <main className="page">
            <section className="auth-token-panel">
              <div className="auth-token-copy">
                <span className="tag">Backend connection</span>
                <h1>Enter your access token</h1>
                <p>{error}</p>
              </div>

              <form className="auth-token-form" onSubmit={handleTokenSubmit}>
                <label className="auth-token-field">
                  <span>Access token</span>
                  <textarea
                    value={tokenInput}
                    onChange={(event) => setTokenInput(event.target.value)}
                    placeholder="Paste your backend access token here"
                    rows={6}
                  />
                </label>

                <div className="auth-token-actions">
                  <button className="comment-submit" type="submit">
                    Save and retry
                  </button>
                  <button
                    className="action-square"
                    type="button"
                    onClick={handleClearToken}
                  >
                    Clear token
                  </button>
                </div>
              </form>
            </section>
          </main>
        </div>
      );
    }

    return (
      <div className="app-shell">
        <LoadingState label={error || "Track unavailable"} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <main className="page">
        <TrackHeader
          track={track}
          comments={comments}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          currentTime={currentTime}
          duration={duration}
        />

        <div className="content-grid">
          <div className="content-column">
            <PlayerCard
              track={track}
              commentCount={commentTotal}
              currentTime={currentTime}
              isDownloading={isDownloading}
              message={feedbackMessage}
              playbackState={playbackState}
              previewDurationSeconds={previewDurationSeconds}
              onAddComment={handleAddComment}
              onDownload={handleDownload}
              onLikeToggle={handleLikeToggle}
              onRepostToggle={handleRepostToggle}
              onShare={handleShare}
              onCopyLink={handleCopyLink}
              view={view}
            />

            {sectionConfig ? (
              <EngagementListModal
                title={sectionConfig.title}
                description={sectionConfig.description}
                variant={sectionConfig.variant}
                items={sectionConfig.items}
              />
            ) : (
              <Comments
                comments={visibleComments}
                totalCount={commentTotal}
                onDeleteComment={handleDeleteComment}
                onJumpToTime={handleSeek}
                onLoadReplies={handleLoadReplies}
                onReplySubmit={handleAddReply}
                onLoadMoreComments={handleLoadMoreComments}
                hasMoreComments={
                  view === "comments" &&
                  (commentsPagination?.page ?? 1) < (commentsPagination?.pages ?? 1)
                }
                isLoadingMoreComments={isLoadingMoreComments}
                onMessage={setPlayerMessage}
                mode={view === "comments" ? "page" : "overview"}
              />
            )}
          </div>

          <HistoryPanel
            track={track}
            currentView={view}
            fanLeaderboard={fanLeaderboard}
            relatedTracks={relatedTracks}
            playlists={playlists}
            likers={likers}
            reposters={reposters}
            isPlaying={isPlaying}
            onLikeToggle={handleLikeToggle}
            onTogglePlay={handleTogglePlay}
          />
        </div>
      </main>
    </div>
  );
}

export default TrackPage;
