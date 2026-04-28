import { useCallback, useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { socialService } from "../services/socialService";
import SocialHeader from "../components/SocialHeader";
import UserCard from "../components/UserCard";
import SuggestedUsers from "../components/SuggestedUsers";
import BlockModal from "../components/BlockModal";
import "../pages/SocialPages.css";

function getStoredUserId() {
  try {
    const stored = localStorage.getItem("pulsify_user");
    return stored ? JSON.parse(stored).id : "me";
  } catch {
    return "me";
  }
}

export default function FollowingPage({ hideNav = false }) {
  const { userId } = useParams();
  const targetUserId = userId || getStoredUserId();
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  /* block modal state */
  const [blockTarget, setBlockTarget] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      const [followingRes, countsRes] = await Promise.all([
        socialService.getFollowing(targetUserId, page, 24),
        socialService.getSocialCounts(targetUserId),
      ]);
      setUsers(followingRes.users);
      setPagination(followingRes.pagination);
      setCounts(countsRes);
    } catch (err) {
      console.error("Failed to load following list:", err);
      setError("Failed to load following list.");
    } finally {
      setIsLoading(false);
    }
  }, [page, targetUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
    setFilter("");
  }, [targetUserId]);

  function handleFollowToggle(userId, nowFollowing) {
    if (!nowFollowing) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setCounts((prev) =>
        prev ? { ...prev, followingCount: prev.followingCount - 1 } : prev,
      );
    }
  }

  function handleMoreClick(user) {
    setBlockTarget(user);
    setShowBlockModal(true);
  }

  async function handleBlockConfirm(userId, reason) {
    await socialService.blockUser(userId, reason);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setCounts((prev) =>
      prev
        ? {
            ...prev,
            followingCount: prev.followingCount - 1,
            blockedCount: prev.blockedCount + 1,
          }
        : prev,
    );
  }

  const filteredUsers = useMemo(() => {
    if (!filter.trim()) return users;
    const q = filter.toLowerCase();
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    );
  }, [users, filter]);

  return (
    <div className="sc-social-page">
      <div className="sc-social-page__container">
        <div className="sc-social-page__banner">
          <h2 className="sc-social-page__title">
            {userId
              ? "People this profile follows:"
              : "Hear what the people you follow have posted:"}
          </h2>
        </div>

        {!hideNav && (
          <SocialHeader
            counts={counts}
            filterValue={filter}
            onFilterChange={setFilter}
            userId={userId}
          />
        )}
        {hideNav && (
          <div className="sc-social-filter" style={{ marginBottom: "16px" }}>
            <input
              type="text"
              className="sc-social-filter__input"
              placeholder="Filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        )}

        <div className="sc-social-page__body">
          <div className="sc-social-page__main">
            {isLoading ? (
              <div className="sc-social-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="sc-user-card sc-user-card--skeleton">
                    <div className="sc-user-card__avatar-wrap sc-skeleton-pulse" />
                    <div
                      className="sc-skeleton-line sc-skeleton-pulse"
                      style={{ width: "70%" }}
                    />
                    <div
                      className="sc-skeleton-line sc-skeleton-pulse"
                      style={{ width: "50%" }}
                    />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="sc-social-empty">
                <p>{error}</p>
                <button className="sc-social-retry" onClick={loadData}>
                  Try again
                </button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="sc-social-empty">
                {filter ? (
                  <p>No users match "{filter}"</p>
                ) : (
                  <>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="#444">
                      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                    <p>You're not following anyone yet</p>
                    <p className="sc-social-empty__sub">
                      Follow artists and creators to see their latest tracks
                      here.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="sc-social-grid">
                  {filteredUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onFollowToggle={handleFollowToggle}
                      onMoreClick={handleMoreClick}
                    />
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="sc-social-pagination">
                    <button
                      className="sc-social-pagination__btn"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      ← Previous
                    </button>
                    <span className="sc-social-pagination__info">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <button
                      className="sc-social-pagination__btn"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {!hideNav && (
            <aside className="sc-social-page__sidebar">
              <SuggestedUsers />
            </aside>
          )}
        </div>
      </div>

      <BlockModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlockConfirm}
        user={blockTarget}
        mode="block"
      />
    </div>
  );
}
