import { useNavigate } from "react-router-dom";
import FollowButton from "./FollowButton";

export default function UserCard({ user, onFollowToggle, showFollowBtn = true, onMoreClick }) {
  const navigate = useNavigate();

  function handleCardClick() {
    navigate(`/profile/${user.id}`);
  }

  function formatCount(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return String(num);
  }

  return (
    <div className="sc-user-card" onClick={handleCardClick}>
      <div className="sc-user-card__avatar-wrap">
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="sc-user-card__avatar"
          />
        ) : (
          <div className="sc-user-card__avatar-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#555">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
        )}
        {user.accountTier === "artist" && (
          <span className="sc-user-card__badge" title="Artist">★</span>
        )}
      </div>

      <h3 className="sc-user-card__name">{user.displayName}</h3>

      <p className="sc-user-card__meta">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#999">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
        {formatCount(user.followersCount)} followers
      </p>

      {showFollowBtn && (
        <div className="sc-user-card__actions" onClick={(e) => e.stopPropagation()}>
          <FollowButton
            userId={user.id}
            initialFollowing={user.isFollowing}
            onToggle={onFollowToggle}
          />
          {onMoreClick && (
            <button
              className="sc-user-card__more-btn"
              onClick={(e) => {
                e.stopPropagation();
                onMoreClick(user);
              }}
              title="More options"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
