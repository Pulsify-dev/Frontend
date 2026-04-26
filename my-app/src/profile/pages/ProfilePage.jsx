import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import ProfileCard from "../components/ProfileCard";
import EditProfileForm from "../components/EditProfileForm";
import { profileService } from "../services/profileService";
import { useAuth } from "@/contexts/AuthContext";
import { PulsifyPlaylistService } from "../../services/pulsifyPlaylistService";
import { PulsifyPlaylistCard } from "../../components/playlists/PulsifyPlaylistCard";
import "../../components/playlists/css/PulsifyPlaylists.css";
import "./ProfilePage.css";

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [playlists, setPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);

  // Viewing own profile if no userId in URL or userId matches logged-in user
  const isOwnProfile = !userId || userId === authUser?.id;

  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const data = isOwnProfile
          ? await profileService.getMyProfile()
          : await profileService.getPublicProfile(userId);
        setProfile(data);
      } catch {
        setErrorMessage("Failed to load profile.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [userId, isOwnProfile]);

  // Fetch playlists when the Playlists tab is activated
  useEffect(() => {
    if (activeTab !== "Playlists") return;
    let cancelled = false;
    const fetchPlaylists = async () => {
      setPlaylistsLoading(true);
      try {
        const data = await PulsifyPlaylistService.retrieveAllPlaylists('me');
        const rawPlaylists = Array.isArray(data) ? data : data.playlists || [];
        // Fetch detailed data for each playlist to get track info
        const detailedPlaylists = await Promise.all(
          rawPlaylists.map(async (pl) => {
            try {
              const detailed = await PulsifyPlaylistService.getPlaylistById(pl._id || pl.id);
              const resolved = detailed.playlist || detailed.data || detailed;
              return resolved;
            } catch {
              return pl;
            }
          })
        );
        if (!cancelled) setPlaylists(detailedPlaylists);
      } catch (err) {
        console.error("Failed to load playlists for profile:", err);
      } finally {
        if (!cancelled) setPlaylistsLoading(false);
      }
    };
    fetchPlaylists();
    return () => { cancelled = true; };
  }, [activeTab]);

  async function handleSave(payload) {
    try {
      const updated = await profileService.updateMyProfile(payload);
      setProfile(updated);
      closeModal();
    } catch (error) {
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

  function openModal() {
    setIsOpen(true);
    setTimeout(() => setIsAnimating(true), 10);
  }

  function closeModal() {
    setIsAnimating(false);
    setTimeout(() => setIsOpen(false), 400);
  }

  // Build tab content for the Playlists tab
  const getTabContent = () => {
    if (activeTab !== "Playlists") return null;

    if (playlistsLoading) {
      return <div style={{ color: '#999', padding: '40px 0', textAlign: 'center' }}>Loading playlists...</div>;
    }

    if (playlists.length === 0) {
      return (
        <div style={{ color: '#999', padding: '40px 0', textAlign: 'center' }}>
          <p>No playlists yet.</p>
        </div>
      );
    }

    return (
      <div className="pulsify-grid-container">
        {playlists.map((pl) => (
          <PulsifyPlaylistCard
            key={pl._id || pl.id}
            playlist={pl}
            onDelete={(id) => setPlaylists((prev) => prev.filter((p) => (p._id || p.id) !== id))}
          />
        ))}
      </div>
    );
  };

  if (isLoading) return <div className="sc-loading">Loading profile...</div>;
  if (errorMessage) return <div className="sc-error">{errorMessage}</div>;
  if (!profile) return <div className="sc-error">No profile found.</div>;

  return (
    <div className="sc-profile-page">
      <ProfileCard
        profile={profile}
        isOwnProfile={isOwnProfile}
        onEditClick={isOwnProfile ? openModal : undefined}
        onCoverUpload={isOwnProfile ? handleCoverUpload : undefined}
        onAvatarUpload={isOwnProfile ? handleAvatarUpload : undefined}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabContent={getTabContent()}
      />

      {isOpen && (
        <div
          className={`sc-overlay ${isAnimating ? "overlay--in" : "overlay--out"}`}
          onClick={closeModal}
        >
          <div
            className={`sc-modal ${isAnimating ? "modal--in" : "modal--out"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="sc-modal-close" onClick={closeModal}>
              ✕
            </button>
            <EditProfileForm
              profile={profile}
              onSave={handleSave}
              onAvatarUpload={handleAvatarUpload}
              onCoverUpload={handleCoverUpload}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}
