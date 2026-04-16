import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socialService } from "../services/socialService";
import FollowButton from "./FollowButton";

export default function SuggestedUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const data = await socialService.getSuggestedUsers(6);
        setUsers(data);
      } catch (err) {
        console.error("Failed to load suggestions:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  function handleFollowToggle(userId, nowFollowing) {
    setUsers((prev) =>
      nowFollowing ? prev.filter((u) => u.id !== userId) : prev
    );
  }

  if (isLoading) {
    return (
      <div className="sc-suggested">
        <h4 className="sc-suggested__title">Who to follow</h4>
        <div className="sc-suggested__skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="sc-suggested__skeleton-row">
              <div className="sc-suggested__skeleton-avatar" />
              <div className="sc-suggested__skeleton-text" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (users.length === 0) return null;

  return (
    <div className="sc-suggested">
      <div className="sc-suggested__header">
        <h4 className="sc-suggested__title">Who to follow</h4>
        <button className="sc-suggested__refresh" onClick={() => window.location.reload()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
        </button>
      </div>

      <div className="sc-suggested__list">
        {users.map((user) => (
          <div key={user.id} className="sc-suggested__item">
            <div
              className="sc-suggested__user"
              onClick={() => navigate(`/profile/${user.id}`)}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="sc-suggested__avatar" />
              ) : (
                <div className="sc-suggested__avatar-ph">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#555">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                </div>
              )}
              <div className="sc-suggested__info">
                <span className="sc-suggested__name">{user.displayName}</span>
                <span className="sc-suggested__followers">
                  {user.followersCount.toLocaleString()} followers
                </span>
              </div>
            </div>
            <FollowButton
              userId={user.id}
              initialFollowing={false}
              onToggle={handleFollowToggle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
