import { useEffect, useState } from "react";
import { socialService } from "../services/socialService";
import SocialHeader from "../components/SocialHeader";
import BlockedUserRow from "../components/BlockedUserRow";
import BlockModal from "../components/BlockModal";
import "../pages/SocialPages.css";

export default function BlockedUsersPage() {
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  /* edit-reason modal */
  const [editTarget, setEditTarget] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const myId = localStorage.getItem("userId") || "me";
      const [blockedRes, countsRes] = await Promise.all([
        socialService.getBlockedUsers(1, 50),
        socialService.getSocialCounts(myId),
      ]);
      setUsers(blockedRes.users);
      setCounts(countsRes);
    } catch (err) {
      setError("Failed to load blocked users.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnblock(userId) {
    await socialService.unblockUser(userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setCounts((prev) =>
      prev ? { ...prev, blockedCount: prev.blockedCount - 1 } : prev
    );
  }

  function handleEditReason(user) {
    setEditTarget(user);
    setShowEditModal(true);
  }

  async function handleUpdateReason(userId, reason) {
    await socialService.updateBlockReason(userId, reason);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, reason } : u))
    );
  }

  return (
    <div className="sc-social-page">
      <div className="sc-social-page__container">
        <div className="sc-social-page__banner">
          <h2 className="sc-social-page__title">Blocked Users</h2>
          <p className="sc-social-page__subtitle">
            Blocked users can't follow you, view your profile, or message you.
          </p>
        </div>

        <SocialHeader counts={counts} />

        <div className="sc-social-page__body">
          <div className="sc-social-page__main sc-social-page__main--full">
            {isLoading ? (
              <div className="sc-blocked-list">
                {[1, 2].map((i) => (
                  <div key={i} className="sc-blocked-row sc-blocked-row--skeleton">
                    <div className="sc-blocked-row__avatar-wrap sc-skeleton-pulse" />
                    <div className="sc-blocked-row__info">
                      <div className="sc-skeleton-line sc-skeleton-pulse" style={{ width: "40%" }} />
                      <div className="sc-skeleton-line sc-skeleton-pulse" style={{ width: "25%" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="sc-social-empty">
                <p>{error}</p>
                <button className="sc-social-retry" onClick={loadData}>Try again</button>
              </div>
            ) : users.length === 0 ? (
              <div className="sc-social-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#444">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9A7.902 7.902 0 014 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1A7.902 7.902 0 0120 12c0 4.42-3.58 8-8 8z" />
                </svg>
                <p>You haven't blocked anyone</p>
                <p className="sc-social-empty__sub">
                  Users you block will appear here.
                </p>
              </div>
            ) : (
              <div className="sc-blocked-list">
                {users.map((user) => (
                  <BlockedUserRow
                    key={user.id}
                    user={user}
                    onUnblock={handleUnblock}
                    onEditReason={handleEditReason}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <BlockModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirm={handleUpdateReason}
        user={editTarget}
        mode="edit"
        initialReason={editTarget?.reason || ""}
      />
    </div>
  );
}
