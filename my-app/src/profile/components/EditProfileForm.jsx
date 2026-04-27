import { useState } from "react";

const LINK_LABELS = {
  instagram: "Instagram",
  twitter: "Twitter",
  x: "X",
  website: "Website",
  support: "Support",
  support_link: "Support",
  supportlink: "Support",
};

const createLinkId = () =>
  `profile-link-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const formatLinkLabel = (key) => {
  const normalizedKey = String(key ?? "").trim().toLowerCase();

  if (LINK_LABELS[normalizedKey]) {
    return LINK_LABELS[normalizedKey];
  }

  return String(key ?? "Link")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const normalizeLinkKey = (value, fallback = "link") => {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || fallback;
};

const getUniqueLinkKey = (links, baseKey) => {
  let key = baseKey;
  let suffix = 2;

  while (Object.prototype.hasOwnProperty.call(links, key)) {
    key = `${baseKey}_${suffix}`;
    suffix += 1;
  }

  return key;
};

const createLinkRow = (key = "", value = "") => {
  const isStructuredValue = value && typeof value === "object";
  const url = isStructuredValue ? value.url ?? value.href ?? "" : value;
  const label = isStructuredValue ? value.label ?? formatLinkLabel(key) : formatLinkLabel(key);

  return {
    id: createLinkId(),
    key,
    label,
    url: String(url ?? ""),
  };
};

const getInitialLinkRows = (socialLinks = {}) => {
  const entries = Array.isArray(socialLinks)
    ? socialLinks.map((link, index) => [
        link.key ?? link.label ?? `link_${index + 1}`,
        link,
      ])
    : Object.entries(socialLinks ?? {});

  return entries
    .map(([key, value]) => createLinkRow(key, value))
    .filter((link) => link.url.trim());
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
  const [location] = useState(profile.location ?? "");
  const [favoriteGenres] = useState(
    profile.favoriteGenres.join(", "),
  );
  const [links, setLinks] = useState(() => getInitialLinkRows(profile.socialLinks));
  const [isPrivate] = useState(profile.isPrivate);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl);

  // Split location into city/country for SoundCloud-style display
  const locationParts = location.split(",").map((s) => s.trim());
  const [city, setCity] = useState(locationParts[0] ?? "");
  const [country, setCountry] = useState(locationParts[1] ?? "");

  async function handleSubmit(e) {
    e.preventDefault();

    const socialLinks = links.reduce((result, link, index) => {
      const url = link.url.trim();

      if (!url) return result;

      const baseKey = normalizeLinkKey(link.label || link.key, `link_${index + 1}`);
      const linkKey = getUniqueLinkKey(result, baseKey);
      result[linkKey] = url;
      return result;
    }, {});

    await onSave({
      displayName,
      bio,
      location: [city, country].filter(Boolean).join(", "),
      favoriteGenres: favoriteGenres
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      isPrivate,
      socialLinks,
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

  function updateLink(linkId, field, value) {
    setLinks((currentLinks) =>
      currentLinks.map((link) =>
        link.id === linkId
          ? {
              ...link,
              [field]: value,
            }
          : link,
      ),
    );
  }

  function addLink() {
    setLinks((currentLinks) => [
      ...currentLinks,
      createLinkRow(`link_${currentLinks.length + 1}`, ""),
    ]);
  }

  function addSupportLink() {
    setLinks((currentLinks) => {
      const existingSupportLink = currentLinks.find(
        (link) => normalizeLinkKey(link.label || link.key) === "support",
      );

      if (existingSupportLink) {
        return currentLinks;
      }

      return [...currentLinks, createLinkRow("support", "")];
    });
  }

  function removeLink(linkId) {
    setLinks((currentLinks) =>
      currentLinks.filter((link) => link.id !== linkId),
    );
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
          {links.map((link) => (
            <div className="sc-edit-link-row" key={link.id}>
              <input
                className="sc-edit-input sc-edit-link-label-input"
                value={link.label}
                onChange={(e) => updateLink(link.id, "label", e.target.value)}
                placeholder="Label"
              />
              <input
                className="sc-edit-input sc-edit-link-input"
                value={link.url}
                onChange={(e) => updateLink(link.id, "url", e.target.value)}
                placeholder="https://example.com"
                inputMode="url"
              />
              <button
                type="button"
                className="sc-remove-link-btn"
                onClick={() => removeLink(link.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="sc-edit-link-btns">
          <button
            type="button"
            className="sc-add-link-btn"
            onClick={addLink}
          >
            Add link
          </button>
          <button
            type="button"
            className="sc-add-support-btn"
            onClick={addSupportLink}
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
