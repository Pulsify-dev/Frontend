import { useEffect, useState, useMemo } from "react";
import { socialService } from "../services/socialService";
import SocialHeader from "../components/SocialHeader";
import UserCard from "../components/UserCard";
import BlockModal from "../components/BlockModal";
import "../pages/SocialPages.css";

export default function FollowersPage() {
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  /* block modal */
  const [blockTarget, setBlockTarget] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [page]);

  async function loadData() {
    try {
      setIsLoading(true);
      const stored = localStorage.getItem("pulsify_user");
      const myId = stored ? JSON.parse(stored).id : "me";
      const [followersRes, countsRes] = await Promise.all([
        socialService.getFollowers(myId, page, 24),
        socialService.getSocialCounts(myId),
      ]);
      setUsers(followersRes.users);
      setPagination(followersRes.pagination);
      setCounts(countsRes);
    } catch (err) {
      setError("Failed to load followers.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFollowToggle(userId, nowFollowing) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, isFollowing: nowFollowing } : u,
      ),
    );
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
            followersCount: prev.followersCount - 1,
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
          <h2 className="sc-social-page__title">People who follow you:</h2>
        </div>

        <SocialHeader
          counts={counts}
          filterValue={filter}
          onFilterChange={setFilter}
        />

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
                    <p>No followers yet</p>
                    <p className="sc-social-empty__sub">
                      When someone follows you, they'll show up here.
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
