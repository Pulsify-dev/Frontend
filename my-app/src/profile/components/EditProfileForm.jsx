import { useState } from "react";

export default function EditProfileForm({
  profile,
  onSave,
  onAvatarUpload,
  onCoverUpload,
}) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [location, setLocation] = useState(profile.location);
  const [favoriteGenres, setFavoriteGenres] = useState(
    profile.favoriteGenres.join(", "),
  );
  const [instagram, setInstagram] = useState(
    profile.socialLinks.instagram ?? "",
  );
  const [twitter, setTwitter] = useState(profile.socialLinks.twitter ?? "");
  const [website, setWebsite] = useState(profile.socialLinks.website ?? "");
  const [isPrivate, setIsPrivate] = useState(profile.isPrivate);

  async function handleSubmit(event) {
    event.preventDefault();

    await onSave({
      displayName,
      bio,
      location,
      favoriteGenres: favoriteGenres
        .split(",")
        .map((genre) => genre.trim())
        .filter(Boolean),
      isPrivate,
      socialLinks: {
        instagram,
        twitter,
        website,
      },
    });
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    await onAvatarUpload(file);
  }

  async function handleCoverChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    await onCoverUpload(file);
  }

  return (
    <form onSubmit={handleSubmit} className="edit-form">
      <div>
        <label htmlFor="displayName">Display Name</label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
        />
      </div>

      <div>
        <label htmlFor="location">Location</label>
        <input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="genres">Favorite Genres</label>
        <input
          id="genres"
          value={favoriteGenres}
          onChange={(e) => setFavoriteGenres(e.target.value)}
          placeholder="Lo-fi, Hip-Hop, EDM"
        />
      </div>

      <div>
        <label htmlFor="instagram">Instagram</label>
        <input
          id="instagram"
          type="url"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="twitter">Twitter</label>
        <input
          id="twitter"
          type="url"
          value={twitter}
          onChange={(e) => setTwitter(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="privacy">Privacy</label>
        <select
          id="privacy"
          value={String(isPrivate)}
          onChange={(e) => setIsPrivate(e.target.value === "true")}
        >
          <option value="false">Public</option>
          <option value="true">Private</option>
        </select>
      </div>

      <div>
        <label htmlFor="avatar">Avatar</label>
        <input
          id="avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleAvatarChange}
        />
      </div>

      <div>
        <label htmlFor="cover">Cover Photo</label>
        <input
          id="cover"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleCoverChange}
        />
      </div>

      <button type="submit">Save Profile</button>
    </form>
  );
}
