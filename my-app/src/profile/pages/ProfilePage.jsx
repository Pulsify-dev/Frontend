import { useEffect, useState } from "react";
import ProfileCard from "../components/ProfileCard";
import EditProfileForm from "../components/EditProfileForm";
import { profileService } from "../services/profileService";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const data = await profileService.getMyProfile();
        setProfile(data);
      } catch {
        setErrorMessage("Failed to load profile.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSave(payload) {
    try {
      const updated = await profileService.updateMyProfile(payload);
      setProfile(updated);
    } catch {
      setErrorMessage("Failed to update profile.");
    }
  }

  async function handleAvatarUpload(file) {
    try {
      const avatarUrl = await profileService.uploadAvatar(file);
      setProfile((current) => (current ? { ...current, avatarUrl } : current));
    } catch {
      setErrorMessage("Failed to upload avatar.");
    }
  }

  async function handleCoverUpload(file) {
    try {
      const coverUrl = await profileService.uploadCover(file);
      setProfile((current) => (current ? { ...current, coverUrl } : current));
    } catch {
      setErrorMessage("Failed to upload cover photo.");
    }
  }

  if (isLoading) return <p>Loading profile...</p>;
  if (errorMessage) return <p>{errorMessage}</p>;
  if (!profile) return <p>No profile found.</p>;

  return (
    <main className="profile-page">
      <ProfileCard profile={profile} />
      <h2>Edit Profile</h2>
      <EditProfileForm
        profile={profile}
        onSave={handleSave}
        onAvatarUpload={handleAvatarUpload}
        onCoverUpload={handleCoverUpload}
      />
    </main>
  );
}
