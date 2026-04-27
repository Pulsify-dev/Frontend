import { useEffect, useState } from "react";
import { socialService } from "@/social/services/socialService";
import BlockedUserRow from "@/social/components/BlockedUserRow";
import BlockModal from "@/social/components/BlockModal";
import "./SettingsPage.css";

const TABS = [
  "Account",
  "Content",
  "Notifications",
  "Privacy",
  "Advertising",
  "Security",
];

/* ── Privacy toggles (persisted in localStorage) ─────────────── */
const PRIVACY_SETTINGS = [
  {
    key: "receiveMessagesFromAnyone",
    label: "Receive messages from anyone",
    description:
      "For your safety, we recommend only allowing messages from people you follow. Turning this on will allow anyone to send you messages.",
  },
  {
    key: "showActivitiesInDiscovery",
    label: "Show my activities in social discovery playlists and modules",
    description:
      "Your Likes, Reactions and other engagement may be shown to other users in discovery features such as 'Liked By' playlists or update feeds. Turning this off won't hide your Likes on your profile or tracks.",
  },
  {
    key: "showFirstOrTopFan",
    label: "Show when I'm a First or Top Fan",
    description: "Appear in public Top Fans and First Fans lists",
  },
  {
    key: "showFansOnMyTracks",
    label: "Show First and Top Fans for my tracks",
    description: "Your First and Top Fans will appear on your tracks",
  },
];

function loadPrivacySettings() {
  try {
    const stored = localStorage.getItem("pulsify_privacy_settings");
    if (stored) return JSON.parse(stored);
  } catch (_e) {
    void _e;
    // ignore parse errors, use defaults
  }
  return {
    receiveMessagesFromAnyone: true,
    showActivitiesInDiscovery: true,
    showFirstOrTopFan: true,
    showFansOnMyTracks: true,
  };
}

function savePrivacySettings(settings) {
  localStorage.setItem("pulsify_privacy_settings", JSON.stringify(settings));
}

/* ── Toggle component ─────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`settings-toggle${checked ? " settings-toggle--on" : ""}`}
    >
      <span className="settings-toggle__thumb" />
    </button>
  );
}

/* ── Privacy tab ──────────────────────────────────────────────── */
function PrivacyTab() {
  const [privacySettings, setPrivacySettings] = useState(loadPrivacySettings);

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [blockedError, setBlockedError] = useState("");

  const [editTarget, setEditTarget] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadBlocked();
  }, []);

  async function loadBlocked() {
    try {
      setBlockedLoading(true);
      const res = await socialService.getBlockedUsers(1, 50);
      setBlockedUsers(res.users);
    } catch {
      setBlockedError("Failed to load blocked users.");
    } finally {
      setBlockedLoading(false);
    }
  }

  function handleToggle(key, value) {
    const updated = { ...privacySettings, [key]: value };
    setPrivacySettings(updated);
    savePrivacySettings(updated);
  }

  async function handleUnblock(userId) {
    await socialService.unblockUser(userId);
    setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  function handleEditReason(user) {
    setEditTarget(user);
    setShowEditModal(true);
  }

  async function handleUpdateReason(userId, reason) {
    await socialService.updateBlockReason(userId, reason);
    setBlockedUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, reason } : u)),
    );
  }

  return (
    <div className="settings-section-wrap">
      {/* Privacy toggles */}
      <section className="settings-section">
        <h2 className="settings-section__title">Privacy settings</h2>
        <div className="settings-toggle-list">
          {PRIVACY_SETTINGS.map(({ key, label, description }) => (
            <div key={key} className="settings-toggle-row">
              <div className="settings-toggle-row__text">
                <span className="settings-toggle-row__label">{label}</span>
                {description && (
                  <span className="settings-toggle-row__desc">
                    {description}
                  </span>
                )}
              </div>
              <Toggle
                checked={privacySettings[key]}
                onChange={(val) => handleToggle(key, val)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Blocked users */}
      <section className="settings-section">
        <h2 className="settings-section__title">Blocked users</h2>

        {blockedLoading ? (
          <div className="settings-blocked-skeleton">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="settings-blocked-skeleton__row sc-skeleton-pulse"
              />
            ))}
          </div>
        ) : blockedError ? (
          <p className="settings-blocked-error">{blockedError}</p>
        ) : blockedUsers.length === 0 ? (
          <p className="settings-blocked-empty">You haven't blocked anyone.</p>
        ) : (
          <div className="sc-blocked-list">
            {blockedUsers.map((user) => (
              <BlockedUserRow
                key={user.id}
                user={user}
                onUnblock={handleUnblock}
                onEditReason={handleEditReason}
              />
            ))}
          </div>
        )}
      </section>

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

/* ── Placeholder for other tabs ───────────────────────────────── */
function PlaceholderTab({ name }) {
  return (
    <div className="settings-section-wrap">
      <section className="settings-section">
        <h2 className="settings-section__title">{name}</h2>
        <p style={{ color: "#999", fontSize: "14px" }}>
          {name} settings — coming soon.
        </p>
      </section>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Privacy");

  function renderTab() {
    if (activeTab === "Privacy") return <PrivacyTab />;
    return <PlaceholderTab name={activeTab} />;
  }

  return (
    <div className="settings-page">
      <div className="settings-page__inner">
        <h1 className="settings-page__heading">Settings</h1>

        <nav className="settings-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`settings-tab${activeTab === tab ? " settings-tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="settings-content">{renderTab()}</div>
      </div>
    </div>
  );
}
