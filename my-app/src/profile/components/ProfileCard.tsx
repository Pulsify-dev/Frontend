import type { Profile } from "../types/profileTypes";
import coverImage from "./profile.jpg";
import profilePhoto from "./profilephoto.jpg";
type Props = {
  profile: Profile;
};

export default function ProfileCard({ profile }: Props) {
  return (
    <section className="profile-card">
      <img src={coverImage} alt="Cover" className="cover-photo" />
      {/* {Change image} */}
      <div className="profile-info">
        <img src={profilePhoto} alt={profile.displayName} className="avatar" />

        <h1>{profile.displayName}</h1>
        <p>@{profile.username}</p>
        <p>{profile.bio}</p>

        <p>
          <strong>Location:</strong> {profile.location}
        </p>

        <p>
          <strong>Account Tier:</strong> {profile.accountTier}
        </p>

        <p>
          <strong>Privacy:</strong> {profile.isPrivate ? "Private" : "Public"}
        </p>

        <div>
          <strong>Favorite Genres:</strong>
          <div className="genres">
            {profile.favoriteGenres.map((genre) => (
              <span key={genre} className="genre-tag">
                {genre}
              </span>
            ))}
          </div>
        </div>

        <div className="social-links">
          {profile.socialLinks.instagram && (
            <a
              href={profile.socialLinks.instagram}
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
          )}

          {profile.socialLinks.twitter && (
            <a
              href={profile.socialLinks.twitter}
              target="_blank"
              rel="noreferrer"
            >
              Twitter
            </a>
          )}

          {profile.socialLinks.website && (
            <a
              href={profile.socialLinks.website}
              target="_blank"
              rel="noreferrer"
            >
              Website
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
