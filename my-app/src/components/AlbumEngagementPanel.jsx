import { useState } from "react";
import {
  checkAlbumLiked,
  checkAlbumReposted,
  getAlbumLikers,
  getAlbumReposters,
  toggleAlbumLike,
  toggleAlbumRepost,
} from "../services/api";

const DEFAULT_PAGE_LIMIT = 20;

const normalizeAlbumId = (value) => String(value ?? "").trim();

function AlbumEngagementPanel() {
  const [albumId, setAlbumId] = useState("");
  const [resolvedAlbumId, setResolvedAlbumId] = useState("");
  const [viewerHasLiked, setViewerHasLiked] = useState(false);
  const [viewerHasReposted, setViewerHasReposted] = useState(false);
  const [likers, setLikers] = useState([]);
  const [reposters, setReposters] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingLike, setIsSubmittingLike] = useState(false);
  const [isSubmittingRepost, setIsSubmittingRepost] = useState(false);

  const loadAlbumEngagement = async (nextAlbumId) => {
    const normalizedAlbumId = normalizeAlbumId(nextAlbumId);
    if (!normalizedAlbumId) {
      setError("Enter an album id first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const [likedResult, repostedResult, likersResult, repostersResult] =
        await Promise.allSettled([
          checkAlbumLiked(normalizedAlbumId),
          checkAlbumReposted(normalizedAlbumId),
          getAlbumLikers(normalizedAlbumId, { page: 1, limit: DEFAULT_PAGE_LIMIT }),
          getAlbumReposters(normalizedAlbumId, {
            page: 1,
            limit: DEFAULT_PAGE_LIMIT,
          }),
        ]);

      setResolvedAlbumId(normalizedAlbumId);
      setViewerHasLiked(
        likedResult.status === "fulfilled" ? Boolean(likedResult.value?.liked) : false,
      );
      setViewerHasReposted(
        repostedResult.status === "fulfilled"
          ? Boolean(repostedResult.value?.reposted)
          : false,
      );
      setLikers(
        likersResult.status === "fulfilled" ? likersResult.value?.likers ?? [] : [],
      );
      setReposters(
        repostersResult.status === "fulfilled"
          ? repostersResult.value?.reposters ?? []
          : [],
      );
      setMessage(`Album engagement loaded for ${normalizedAlbumId}.`);
    } catch (loadError) {
      setError(loadError?.message || "Could not load album engagement.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!resolvedAlbumId || isSubmittingLike) return;

    const shouldLike = !viewerHasLiked;
    setIsSubmittingLike(true);
    setViewerHasLiked(shouldLike);

    try {
      await toggleAlbumLike(resolvedAlbumId, shouldLike);
      await loadAlbumEngagement(resolvedAlbumId);
    } catch (error) {
      setViewerHasLiked(!shouldLike);
      setError(error?.message || "Could not update album likes.");
    } finally {
      setIsSubmittingLike(false);
    }
  };

  const handleRepostToggle = async () => {
    if (!resolvedAlbumId || isSubmittingRepost) return;

    const shouldRepost = !viewerHasReposted;
    setIsSubmittingRepost(true);
    setViewerHasReposted(shouldRepost);

    try {
      await toggleAlbumRepost(resolvedAlbumId, shouldRepost);
      await loadAlbumEngagement(resolvedAlbumId);
    } catch (error) {
      setViewerHasReposted(!shouldRepost);
      setError(error?.message || "Could not update album reposts.");
    } finally {
      setIsSubmittingRepost(false);
    }
  };

  return (
    <section className="library-album-panel">
      <div className="library-section-header">
        <div>
          <h1>Albums</h1>
          <p>Paste a real album id to test the live album engagement APIs.</p>
        </div>
      </div>

      <div className="library-album-shell">
        <form
          className="library-album-form"
          onSubmit={(event) => {
            event.preventDefault();
            loadAlbumEngagement(albumId);
          }}
        >
          <label className="library-album-field">
            <span>Album id</span>
            <input
              type="text"
              value={albumId}
              onChange={(event) => setAlbumId(event.target.value)}
              placeholder="Paste a real album id"
            />
          </label>

          <button className="library-album-submit" type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Load album"}
          </button>
        </form>

        {resolvedAlbumId ? (
          <div className="library-album-status">
            <span
              className={`library-album-pill ${
                viewerHasLiked ? "is-active" : ""
              }`}
            >
              {viewerHasLiked ? "Liked" : "Not liked"}
            </span>
            <span
              className={`library-album-pill ${
                viewerHasReposted ? "is-active" : ""
              }`}
            >
              {viewerHasReposted ? "Reposted" : "Not reposted"}
            </span>
          </div>
        ) : null}

        <div className="library-album-actions">
          <button
            className="library-album-action"
            type="button"
            onClick={handleLikeToggle}
            disabled={!resolvedAlbumId || isSubmittingLike}
          >
            {isSubmittingLike
              ? "Saving..."
              : viewerHasLiked
              ? "Unlike album"
              : "Like album"}
          </button>
          <button
            className="library-album-action"
            type="button"
            onClick={handleRepostToggle}
            disabled={!resolvedAlbumId || isSubmittingRepost}
          >
            {isSubmittingRepost
              ? "Saving..."
              : viewerHasReposted
              ? "Undo repost"
              : "Repost album"}
          </button>
        </div>

        {message ? <p className="library-album-note">{message}</p> : null}
        {error ? <p className="library-album-note is-error">{error}</p> : null}

        <div className="library-album-grid">
          <div className="library-album-card">
            <h2>Likers</h2>
            {likers.length ? (
              <div className="library-album-people">
                {likers.map((user) => (
                  <article className="library-album-person" key={`album-like-${user.id}`}>
                    <img src={user.avatar} alt={user.name} />
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.handle}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>No likers returned yet.</p>
            )}
          </div>

          <div className="library-album-card">
            <h2>Reposters</h2>
            {reposters.length ? (
              <div className="library-album-people">
                {reposters.map((user) => (
                  <article
                    className="library-album-person"
                    key={`album-repost-${user.id}`}
                  >
                    <img src={user.avatar} alt={user.name} />
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.handle}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>No reposters returned yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AlbumEngagementPanel;
