import { useState } from "react";
import { PlatformIcon, detectPlatform } from "./SocialPlatforms";

const SOCIAL_LINK_PLATFORMS = [
  "instagram",
  "twitter",
  "youtube",
  "facebook",
  "tiktok",
  "website",
  "patreon",
  "kofi",
];

const normalizeLinkUrl = (url) => {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return "";
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
};

const buildInitialLinks = (socialLinks = {}) => {
  const result = [];
  const seen = new Set();

  const addLink = (link) => {
    const url = normalizeLinkUrl(link?.url);
    if (!url || seen.has(url)) return;

    seen.add(url);
    result.push({
      platform: link.platform ?? detectPlatform(url),
      url,
      isSupport: link.isSupport ?? ["patreon", "kofi"].includes(link.platform),
    });
  };

  SOCIAL_LINK_PLATFORMS.forEach((platform) => {
    if (socialLinks[platform]) {
      addLink({
        platform,
        url: socialLinks[platform],
        isSupport: ["patreon", "kofi"].includes(platform),
      });
    }
  });

  if (Array.isArray(socialLinks.links)) {
    socialLinks.links.forEach(addLink);
  }

  Object.entries(socialLinks).forEach(([key, value]) => {
    if (key === "links" || SOCIAL_LINK_PLATFORMS.includes(key)) return;

    if (typeof value === "string") {
      addLink({ platform: detectPlatform(value), url: value });
      return;
    }

    if (value && typeof value === "object") {
      addLink({
        platform: value.platform ?? detectPlatform(value.url ?? value.href),
        url: value.url ?? value.href,
        isSupport: value.isSupport ?? false,
      });
    }
  });

  return result;
};

const buildSocialLinksPayload = (links) => {
  const cleanLinks = links
    .map((link) => ({
      platform: link.platform ?? detectPlatform(link.url),
      url: normalizeLinkUrl(link.url),
      isSupport: Boolean(link.isSupport),
    }))
    .filter((link) => link.url);

  const payload = {};

  cleanLinks.forEach((link, index) => {
    const platform = link.platform || "website";
    if (!payload[platform]) {
      payload[platform] = link.url;
      return;
    }

    payload[`link_${index + 1}`] = link.url;
  });

  return payload;
};

export default function EditProfileForm({
  profile,
  onSave,
  onAvatarUpload,
  onCoverUpload,
  onCancel,
}) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [location, _setLocation] = useState(profile.location ?? "");
  const [favoriteGenres, _setFavoriteGenres] = useState(
    profile.favoriteGenres.join(", "),
  );
  const [isPrivate, _setIsPrivate] = useState(profile.isPrivate);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl);
  const [links, setLinks] = useState(() => buildInitialLinks(profile.socialLinks));

  // Split location into city/country for SoundCloud-style display
  const locationParts = location.split(",").map((s) => s.trim());
  const [city, setCity] = useState(locationParts[0] ?? "");
  const [country, setCountry] = useState(locationParts[1] ?? "");

  async function handleSubmit(e) {
    e.preventDefault();

    await onSave({
      displayName,
      bio,
      location: [city, country].filter(Boolean).join(", "),
      favoriteGenres: favoriteGenres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      isPrivate,
      socialLinks: buildSocialLinksPayload(links),
    });
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    await onAvatarUpload(file);
  }

  async function handleCoverChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    await onCoverUpload(file);
  }

  return (
    <form onSubmit={handleSubmit} className="sc-edit-form">
      <h2 className="sc-edit-title">Edit your Profile</h2>

      <div className="sc-edit-body">
        {/* Left: avatar upload */}
        <div className="sc-edit-avatar-col">
          <div className="sc-edit-avatar-wrap">
            <img
              src={avatarPreview}
              alt="Avatar"
              className="sc-edit-avatar-img"
            />
            <label className="sc-edit-avatar-overlay">
              Upload image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handleAvatarChange}
              />
            </label>
          </div>
        </div>

        {/* Right: fields */}
        <div className="sc-edit-fields">
          <div className="sc-edit-field">
            <label className="sc-edit-label">
              Display name <span className="sc-required">*</span>
            </label>
            <input
              className="sc-edit-input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div className="sc-edit-field">
            <label className="sc-edit-label">
              Profile URL <span className="sc-required">*</span>
            </label>
            <div className="sc-edit-url-wrap">
              <span className="sc-edit-url-prefix">soundcloud.com/</span>
              <input
                className="sc-edit-input sc-edit-url-input"
                value={profile.username}
                readOnly
              />
            </div>
          </div>

          <div className="sc-edit-row">
            <div className="sc-edit-field">
              <label className="sc-edit-label">First name</label>
              <input className="sc-edit-input" placeholder="First name" />
            </div>
            <div className="sc-edit-field">
              <label className="sc-edit-label">Last name</label>
              <input className="sc-edit-input" placeholder="Last name" />
            </div>
          </div>

          <div className="sc-edit-row">
            <div className="sc-edit-field">
              <label className="sc-edit-label">City</label>
              <input
                className="sc-edit-input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="sc-edit-field">
              <label className="sc-edit-label">Country</label>
              <input
                className="sc-edit-input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
          </div>

          <div className="sc-edit-field">
            <label className="sc-edit-label">Bio</label>
            <textarea
              className="sc-edit-input sc-edit-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              placeholder="Tell the world a little bit about yourself. The shorter the better."
            />
          </div>
        </div>
      </div>

      {/* Links section */}
      <div className="sc-edit-links-section">
        <div className="sc-edit-links-header">
          <span className="sc-edit-label">Your links</span>
        </div>
        <div className="sc-edit-link-fields">
          {links.map((link, i) => (
            <div key={i} className="sc-link-row">
              <span className="sc-link-icon">
                <PlatformIcon platform={link.platform} size={18} />
              </span>
              <input
                className="sc-edit-input sc-edit-link-url-input"
                value={link.url}
                onChange={(e) => {
                  const url = e.target.value;
                  const updated = [...links];
                  updated[i] = {
                    ...updated[i],
                    url,
                    platform: link.isSupport
                      ? link.platform
                      : detectPlatform(url),
                  };
                  setLinks(updated);
                }}
                placeholder={
                  link.isSupport
                    ? "Support page URL (Patreon, Ko-fi…)"
                    : "https://"
                }
                type="text"
                inputMode="url"
                autoComplete="url"
              />
              <button
                type="button"
                className="sc-link-delete-btn"
                onClick={() => setLinks(links.filter((_, j) => j !== i))}
                aria-label="Remove link"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        <div className="sc-edit-link-btns">
          <button
            type="button"
            className="sc-add-link-btn"
            onClick={() =>
              setLinks([
                ...links,
                { platform: "website", url: "", isSupport: false },
              ])
            }
          >
            Add link
          </button>
          <button
            type="button"
            className="sc-add-support-btn"
            onClick={() =>
              setLinks([
                ...links,
                { platform: "patreon", url: "", isSupport: true },
              ])
            }
          >
            Add support link
          </button>
        </div>
      </div>

      {/* Cover photo upload (hidden, accessible) */}
      <div className="sc-edit-cover-row">
        <label className="sc-edit-label">Cover photo</label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleCoverChange}
          className="sc-edit-cover-input"
        />
      </div>

      {/* Footer buttons */}
      <div className="sc-edit-footer">
        <button type="button" className="sc-cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="sc-save-btn">
          Save changes
        </button>
      </div>
    </form>
  );
}
