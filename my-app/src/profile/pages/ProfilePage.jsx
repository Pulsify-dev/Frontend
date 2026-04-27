import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import ProfileCard from "../components/ProfileCard";
import EditProfileForm from "../components/EditProfileForm";
import { profileService } from "../services/profileService";
import { useAuth } from "@/contexts/AuthContext";
import { PulsifyPlaylistService } from "../../services/pulsifyPlaylistService";
import { PulsifyPlaylistCard } from "../../components/playlists/PulsifyPlaylistCard";
import { PulsifyAlbumService } from "../../services/pulsifyAlbumService";
import { PulsifyAlbumCard } from "../../components/albums/PulsifyAlbumCard";
import "../../components/playlists/css/PulsifyPlaylists.css";
import "../../components/albums/css/PulsifyAlbums.css";
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
  const [albums, setAlbums] = useState([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);

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
    if (!profile?.id) return;
    let cancelled = false;
    const fetchPlaylists = async () => {
      setPlaylistsLoading(true);
      try {
        let rawPlaylists = [];
        
        if (isOwnProfile) {
          // If viewing own profile, get my private and public playlists
          const data = await PulsifyPlaylistService.retrieveAllPlaylists('me');
          rawPlaylists = data.playlists || data.data || (Array.isArray(data) ? data : []);
        } else {
          // If viewing someone else, the backend is missing /users/:id/playlists
          // WORKAROUND: Fetch public playlists and filter by creator ID
          try {
            const { data } = await import('../../services/api').then(m => m.pulsifyAxiosInstance.get('/playlists/discover/public?limit=100'));
            const publicPlaylists = data.data || [];
            rawPlaylists = publicPlaylists.filter(p => {
              const cId = p.creator_id?._id || p.creator_id?.id || p.creator_id;
              return cId === profile.id;
            });
          } catch (e) {
            console.error("Failed to fetch public playlists for filtering", e);
          }
        }

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

  // Fetch albums when the Albums tab is activated
  useEffect(() => {
    if (activeTab !== "Albums") return;
    if (!profile?.id) return;
    let cancelled = false;
    const fetchAlbums = async () => {
      setAlbumsLoading(true);
      try {
        console.log('[ProfilePage] Fetching albums for artist:', profile.id);
        // Use the artist-specific endpoint (the one the backend actually supports)
        const data = await PulsifyAlbumService.getArtistAlbums(profile.id);
        console.log('[ProfilePage] getArtistAlbums response:', data);
        const rawAlbums = data.albums || data.data || (Array.isArray(data) ? data : []);
        console.log('[ProfilePage] rawAlbums:', rawAlbums);
        // Fetch detailed data for each album to get track info
        const detailedAlbums = await Promise.all(
          rawAlbums.map(async (alb) => {
            try {
              const detailed = await PulsifyAlbumService.getAlbumById(alb._id || alb.id);
              const resolved = detailed.album || detailed.data || detailed;
              return resolved;
            } catch {
              return alb;
            }
          })
        );
        if (!cancelled) setAlbums(detailedAlbums);
      } catch (err) {
        console.error("Failed to load albums for profile:", err);
      } finally {
        if (!cancelled) setAlbumsLoading(false);
      }
    };
    fetchAlbums();
    return () => { cancelled = true; };
  }, [activeTab, profile?.id]);

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
    if (activeTab === "Playlists") {
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
    }

    if (activeTab === "Albums") {
      if (albumsLoading) {
        return <div style={{ color: '#999', padding: '40px 0', textAlign: 'center' }}>Loading albums...</div>;
      }
      if (albums.length === 0) {
        return (
          <div style={{ color: '#999', padding: '40px 0', textAlign: 'center' }}>
            <p>No albums yet.</p>
          </div>
        );
      }
      return (
        <div className="pulsify-grid-container">
          {albums.map((alb) => (
            <PulsifyAlbumCard
              key={alb._id || alb.id}
              album={alb}
              onDelete={(id) => setAlbums((prev) => prev.filter((a) => (a._id || a.id) !== id))}
            />
          ))}
        </div>
      );
    }

    return null;
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
