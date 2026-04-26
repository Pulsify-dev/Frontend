import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { socialService } from "../../social/services/socialService";
import FollowButton from "../../social/components/FollowButton";
import { PlatformIcon, detectPlatform } from "./SocialPlatforms";

const TABS = [
  { label: "All", path: null },
  { label: "Popular tracks", path: null },
  { label: "Tracks", path: null },
  { label: "Albums", path: null },
  { label: "Playlists", path: "/playlists" },
  { label: "Reposts", path: null },
  { label: "Feed", path: "/feed" },
];

export default function ProfileCard({
  profile,
  onEditClick,
  onCoverUpload,
  onAvatarUpload,
  isOwnProfile = true,
}) {
  const navigate = useNavigate();
  const [socialCounts, setSocialCounts] = useState({
    followersCount: 0,
    followingCount: 0,
    blockedCount: 0,
  });

  useEffect(() => {
    async function loadCounts() {
      try {
        const data = await socialService.getSocialCounts(profile.id);
        setSocialCounts(data);
      } catch (err) {
        console.error("Failed to load social counts:", err);
      }
    }
    if (profile?.id) loadCounts();
  }, [profile?.id]);

  async function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    await onCoverUpload?.(file);
  }
  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    await onAvatarUpload?.(file);
  }

  return (
    <div className="sc-profile-card">
      {/* Cover */}
      <div
        className="sc-cover"
        style={
          profile.coverUrl
            ? { backgroundImage: `url(${profile.coverUrl})` }
            : {}
        }
      >
        <div className="sc-cover-overlay" />
        <label className="sc-upload-header-btn">
          Upload header image
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleCoverChange}
          />
        </label>

        <div className="sc-avatar-wrap">
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="sc-avatar"
          />
          <label className="sc-upload-avatar-btn">
            Upload image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        <div className="sc-cover-info">
          <h1 className="sc-display-name">{profile.displayName}</h1>
          {profile.location && (
            <p className="sc-location">{profile.location}</p>
          )}
        </div>
      </div>

      {/* Tabs bar */}
      <div className="sc-tabs-bar">
        <div className="sc-tabs">
          {TABS.map((tab) =>
            tab.path ? (
              <Link key={tab.label} to={tab.path} className="sc-tab">
                {tab.label}
              </Link>
            ) : (
              <button
                key={tab.label}
                className={`sc-tab ${tab.label === "All" ? "sc-tab--active" : ""}`}
              >
                {tab.label}
              </button>
            ),
          )}
        </div>
        <div className="sc-actions">
          <button className="sc-action-btn sc-share-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
            </svg>
            Share
          </button>
          <button className="sc-action-btn sc-edit-btn" onClick={onEditClick}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
            Edit
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="sc-content-area">
        <div className="sc-main-content">
          <div className="sc-empty-state">
            <p>Seems a little quiet over here</p>
            <button
              className="sc-upload-now-btn"
              onClick={() => navigate("/upload")}
            >
              Upload now
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="sc-sidebar">
          <div className="sc-stats">
            <div
              className="sc-stat sc-stat-link"
              onClick={() => navigate(`/followers`)}
              style={{ cursor: "pointer" }}
            >
              <span className="sc-stat-label">Followers</span>
              <span className="sc-stat-value">
                {socialCounts.followersCount}
              </span>
            </div>
            <div
              className="sc-stat sc-stat-link"
              onClick={() => navigate(`/following`)}
              style={{ cursor: "pointer" }}
            >
              <span className="sc-stat-label">Following</span>
              <span className="sc-stat-value">
                {socialCounts.followingCount}
              </span>
            </div>
            <div className="sc-stat">
              <span className="sc-stat-label">Tracks</span>
              <span className="sc-stat-value">0</span>
            </div>
          </div>

          {profile.bio && (
            <div className="sc-sidebar-bio">
              <p>{profile.bio}</p>
            </div>
          )}

          {profile.favoriteGenres?.length > 0 && (
            <div className="sc-sidebar-genres">
              {profile.favoriteGenres.map((g) => (
                <span key={g} className="sc-genre-tag">
                  {g}
                </span>
              ))}
            </div>
          )}

          <div className="sc-sidebar-links">
            {[
              ...(profile.socialLinks?.instagram
                ? [
                    {
                      platform: "instagram",
                      url: profile.socialLinks.instagram,
                    },
                  ]
                : []),
              ...(profile.socialLinks?.twitter
                ? [{ platform: "twitter", url: profile.socialLinks.twitter }]
                : []),
              ...(profile.socialLinks?.website
                ? [{ platform: "website", url: profile.socialLinks.website }]
                : []),
              ...(profile.socialLinks?.links?.filter((l) => l.url) ?? []),
            ].map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="sc-social-link"
              >
                <PlatformIcon
                  platform={link.platform ?? detectPlatform(link.url)}
                  size={14}
                />
                <span>
                  {link.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                </span>
              </a>
            ))}
          </div>

          {/* Quick nav to other modules */}
          <div className="sc-sidebar-nav">
            <Link to="/feed" className="sc-nav-link">
              🎵 My Feed
            </Link>
            <Link to="/search" className="sc-nav-link">
              🔍 Discover
            </Link>
            <Link to="/trending" className="sc-nav-link">
              📈 Trending
            </Link>
            <Link to="/premium" className="sc-nav-link sc-nav-link--premium">
              ⭐ Go Pro
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
