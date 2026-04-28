import { useEffect, useState } from "react";
import { socialService } from "../services/socialService";

export default function FollowButton({
  userId,
  initialFollowing = false,
  onToggle,
}) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsFollowing(initialFollowing);
  }, [initialFollowing]);

  useEffect(() => {
    if (!userId) return;
    socialService
      .getRelationship(userId)
      .then((rel) => {
        setIsFollowing(rel?.isFollowing ?? false);
        setIsBlockedByThem(rel?.isBlockedByThem ?? false);
      })
      .catch((err) => console.error("Failed to load follow state:", err));
  }, [userId]);

  async function handleClick(e) {
    e.stopPropagation();
    if (isLoading || !userId) return;
    setIsLoading(true);
    try {
      if (isFollowing) {
        await socialService.unfollowUser(userId);
        setIsFollowing(false);
        onToggle?.(userId, false);
      } else {
        await socialService.followUser(userId);
        setIsFollowing(true);
        onToggle?.(userId, true);
      }
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isBlockedByThem) return null;

  const showUnfollow = isFollowing && isHovered;

  return (
    <button
      className={`sc-follow-btn ${isFollowing ? "sc-follow-btn--following" : ""} ${showUnfollow ? "sc-follow-btn--unfollow" : ""}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="sc-follow-spinner" />
      ) : isFollowing ? (
        <>
          {showUnfollow ? (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              Unfollow
            </>
          ) : (
            <>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Following
            </>
          )}
        </>
      ) : (
        <>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 11h-3V8a1 1 0 00-2 0v3H8a1 1 0 000 2h3v3a1 1 0 002 0v-3h3a1 1 0 000-2z" />
          </svg>
          Follow
        </>
      )}
    </button>
  );
}
