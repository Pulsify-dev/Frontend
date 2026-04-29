import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ProfileCard from "../components/ProfileCard";
import EditProfileForm from "../components/EditProfileForm";
import { profileService } from "../services/profileService";
import { useAuth } from "@/contexts/AuthContext";
import { usePlayer } from "@/hooks/usePlayer";
import { PulsifyPlaylistService } from "../../services/pulsifyPlaylistService";
import { PulsifyPlaylistCard } from "../../components/playlists/PulsifyPlaylistCard";
import { PulsifyAlbumService } from "../../services/pulsifyAlbumService";
import { PulsifyAlbumCard } from "../../components/albums/PulsifyAlbumCard";
import {
  deleteTrack,
  getArtistTracks,
  getListeningHistory,
  getRecentlyPlayed,
  getTrack,
  getViewerLikedTracks,
  getViewerRepostedTracks,
  toggleLike,
  toggleRepost,
} from "@/services/api";
import "../../components/playlists/css/PulsifyPlaylists.css";
import "../../components/albums/css/PulsifyAlbums.css";
import "./ProfilePage.css";

// ─── Track snapshot helpers (from integrated) ────────────────────────────────

const mergeTrackSnapshot = (track = {}, detail = {}) => ({
  ...track,
  ...detail,
  id: detail.id ?? track.id ?? track.trackId,
  trackId: detail.trackId ?? detail.id ?? track.trackId ?? track.id ?? "",
  historyEntryId: detail.historyEntryId ?? track.historyEntryId ?? null,
  title: detail.title ?? track.title ?? "Untitled track",
  artist: detail.artist ?? track.artist ?? "Unknown artist",
  artistHandle: detail.artistHandle ?? track.artistHandle ?? "",
  cover: detail.cover ?? track.cover ?? "",
  duration: Number(detail.duration ?? track.duration ?? 0),
  playCount: Number(detail.playCount ?? track.playCount ?? 0),
  likeCount: Number(detail.likeCount ?? track.likeCount ?? 0),
  repostCount: Number(detail.repostCount ?? track.repostCount ?? 0),
  commentCount: Number(detail.commentCount ?? track.commentCount ?? 0),
  audioUrl: detail.audioUrl ?? track.audioUrl ?? "",
  playbackState: detail.playbackState ?? track.playbackState ?? "Playable",
  previewDurationSeconds: Number(
    detail.previewDurationSeconds ?? track.previewDurationSeconds ?? 0,
  ),
  waveform: detail.waveform ?? track.waveform ?? [],
  postedAt: detail.postedAt ?? track.postedAt ?? null,
  typeLabel: detail.typeLabel ?? track.typeLabel ?? "Music",
  viewerHasLiked: Boolean(detail.viewerHasLiked ?? track.viewerHasLiked),
  viewerHasReposted: Boolean(
    detail.viewerHasReposted ?? track.viewerHasReposted,
  ),
});

const enrichLibraryEntry = (entry, detail = {}) => {
  const mergedTrack = mergeTrackSnapshot(entry, detail);
  const resolvedTrackId = mergedTrack.trackId ?? mergedTrack.id;

  return {
    ...mergedTrack,
    id: resolvedTrackId,
    trackId: resolvedTrackId,
    historyEntryId: entry.historyEntryId ?? entry.id ?? null,
    played_at: entry.played_at ?? entry.playedAt ?? null,
    playedAt: entry.played_at ?? entry.playedAt ?? null,
    duration_played_ms:
      entry.duration_played_ms ??
      entry.durationPlayedMs ??
      Math.max((mergedTrack.duration ?? 0) * 1000, 0),
  };
};

const updateCollectionTrack = (collection, trackId, snapshot) =>
  collection.map((track) =>
    track.id === trackId ? { ...track, ...snapshot } : track,
  );

const removeTrackFromCollection = (collection, trackId) =>
  collection.filter((track) => track.id !== trackId);

const getPlayedAtTime = (entry = {}) => {
  const timestamp = new Date(entry.played_at ?? entry.playedAt ?? 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortLibraryEntriesByPlayedAt = (entries = []) =>
  [...entries].sort(
    (left, right) => getPlayedAtTime(right) - getPlayedAtTime(left),
  );

const dedupeLibraryEntriesByTrack = (entries = []) => {
  const entryMap = new Map();
  sortLibraryEntriesByPlayedAt(entries).forEach((entry) => {
    if (!entry?.id || entryMap.has(entry.id)) return;
    entryMap.set(entry.id, entry);
  });
  return [...entryMap.values()];
};

const getLibraryTrackId = (entry = {}) => entry.trackId ?? entry.id ?? "";
const profileLibrarySurfaceCache = new Map();

const cachedProfileLibraryRequest = (key, requestFn) => {
  if (!profileLibrarySurfaceCache.has(key)) {
    profileLibrarySurfaceCache.set(
      key,
      requestFn().catch((error) => {
        profileLibrarySurfaceCache.delete(key);
        throw error;
      }),
    );
  }

  return profileLibrarySurfaceCache.get(key);
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: authUser } = useAuth();
  const { currentTrack, isPlaying, syncCurrentTrack } = usePlayer();

  // Profile state
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Tab state (from main — keeps Albums & Playlists)
  const [activeTab, setActiveTab] = useState("All");
  const [playlists, setPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);

  // Library surfaces (from integrated)
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [likedTracks, setLikedTracks] = useState([]);
  const [repostedTracks, setRepostedTracks] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [historyTracks, setHistoryTracks] = useState([]);
  const [pendingLikeTrackIds, setPendingLikeTrackIds] = useState({});
  const [pendingRepostTrackIds, setPendingRepostTrackIds] = useState({});
  const [pendingDeleteTrackIds, setPendingDeleteTrackIds] = useState({});

  const currentTrackRef = useRef(null);
  const lastPinnedRecentTrackIdRef = useRef("");

  // Viewing own profile if no userId in URL or userId matches logged-in user
  const isOwnProfile = !userId || userId === authUser?.id;

  // Keep a stable ref to the current track for use inside effects
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // ── Load profile ────────────────────────────────────────────────────────────
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

  // ── Load library surfaces (liked, reposted, recent, history) ────────────────
  useEffect(() => {
    if (!isOwnProfile && !profile?.id) return;

    let cancelled = false;

    async function loadLibrarySurfaces() {
      try {
        setIsLibraryLoading(true);
        if (!isOwnProfile) {
          const artistTracksPayload = await cachedProfileLibraryRequest(
            `profile-artist-tracks:${profile.id}`,
            () => getArtistTracks(profile.id, { page: 1, limit: 20 }),
          );

          if (cancelled) return;

          const artistTracks = (artistTracksPayload?.tracks ?? []).map(
            (track) => mergeTrackSnapshot(track),
          );

          setLikedTracks([]);
          setRepostedTracks([]);
          setRecentTracks(artistTracks);
          setHistoryTracks([]);
          return;
        }

        const [likes, reposts, recentEntries, historyEntries] =
          await cachedProfileLibraryRequest(
            `profile-own-library:${authUser?.id ?? "me"}`,
            () =>
              Promise.all([
                getViewerLikedTracks(),
                getViewerRepostedTracks(),
                getRecentlyPlayed(),
                getListeningHistory(),
              ]),
          );

        const trackIds = [
          ...new Set(
            [...likes, ...reposts, ...recentEntries, ...historyEntries]
              .map((entry) => getLibraryTrackId(entry))
              .filter(Boolean),
          ),
        ];

        const detailResults = await Promise.allSettled(
          trackIds.map((trackId) => getTrack(trackId)),
        );
        const detailMap = new Map();
        const failedTrackIds = new Set();

        detailResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            detailMap.set(trackIds[index], result.value);
          } else {
            failedTrackIds.add(trackIds[index]);
          }
        });

        if (failedTrackIds.size > 0) {
          console.warn(
            `${failedTrackIds.size} tracks not found on backend:`,
            Array.from(failedTrackIds),
          );
        }

        if (cancelled) return;

        const filterValidTracks = (entries) =>
          entries.filter(
            (entry) => !failedTrackIds.has(getLibraryTrackId(entry)),
          );

        setLikedTracks(
          filterValidTracks(
            likes.map((entry) =>
              mergeTrackSnapshot(
                entry,
                detailMap.get(getLibraryTrackId(entry)),
              ),
            ),
          ),
        );
        setRepostedTracks(
          filterValidTracks(
            reposts.map((entry) =>
              mergeTrackSnapshot(
                entry,
                detailMap.get(getLibraryTrackId(entry)),
              ),
            ),
          ),
        );
        setRecentTracks(
          dedupeLibraryEntriesByTrack(
            filterValidTracks(
              recentEntries.map((entry) =>
                enrichLibraryEntry(
                  entry,
                  detailMap.get(getLibraryTrackId(entry)),
                ),
              ),
            ),
          ),
        );
        setHistoryTracks(
          sortLibraryEntriesByPlayedAt(
            filterValidTracks(
              historyEntries.map((entry) =>
                enrichLibraryEntry(
                  entry,
                  detailMap.get(getLibraryTrackId(entry)),
                ),
              ),
            ),
          ),
        );
      } catch (error) {
        console.error("Failed to load engagement surfaces.", error);
      } finally {
        if (!cancelled) setIsLibraryLoading(false);
      }
    }

    loadLibrarySurfaces();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, isOwnProfile, profile?.id]);

  // ── Pin currently playing track into recent/history ─────────────────────────
  useEffect(() => {
    const activeTrack = currentTrackRef.current;
    if (isLibraryLoading || !isPlaying || !activeTrack?.id) return;
    if (lastPinnedRecentTrackIdRef.current === activeTrack.id) return;

    lastPinnedRecentTrackIdRef.current = activeTrack.id;
    const playedAt = new Date().toISOString();

    setRecentTracks((current) => {
      const existingTrack = current.find(
        (track) => track.id === activeTrack.id,
      );
      const nextTrack = enrichLibraryEntry(
        {
          ...(existingTrack ?? {}),
          ...activeTrack,
          played_at: playedAt,
          playedAt,
          duration_played_ms: Math.max(
            Number(activeTrack.duration ?? 0) * 1000,
            0,
          ),
        },
        activeTrack,
      );
      return [
        nextTrack,
        ...current.filter((track) => track.id !== activeTrack.id),
      ].slice(0, 8);
    });

    setHistoryTracks((current) => {
      const existingTrack = current.find(
        (track) => track.id === activeTrack.id,
      );
      const nextTrack = enrichLibraryEntry(
        {
          ...(existingTrack ?? {}),
          ...activeTrack,
          played_at: playedAt,
          playedAt,
          duration_played_ms: Math.max(
            Number(activeTrack.duration ?? 0) * 1000,
            0,
          ),
        },
        activeTrack,
      );
      return [nextTrack, ...current];
    });
  }, [currentTrack?.id, isLibraryLoading, isPlaying]);

  // ── Fetch playlists when the Playlists tab is activated ─────────────────────
  useEffect(() => {
    if (activeTab !== "Playlists") return;
    if (!profile?.id) return;

    let cancelled = false;

    const fetchPlaylists = async () => {
      setPlaylistsLoading(true);
      try {
        let rawPlaylists = [];

        if (isOwnProfile) {
          const data = await PulsifyPlaylistService.retrieveAllPlaylists("me");
          rawPlaylists =
            data.playlists || data.data || (Array.isArray(data) ? data : []);
        } else {
          try {
            const { data } = await import("../../services/api").then((m) =>
              m.pulsifyAxiosInstance.get(
                "/playlists/discover/public?limit=100",
              ),
            );
            const publicPlaylists = data.data || [];
            rawPlaylists = publicPlaylists.filter((p) => {
              const cId = p.creator_id?._id || p.creator_id?.id || p.creator_id;
              return cId === profile.id;
            });
          } catch (e) {
            console.error("Failed to fetch public playlists for filtering", e);
          }
        }

        const detailedPlaylists = await Promise.all(
          rawPlaylists.map(async (pl) => {
            try {
              const detailed = await PulsifyPlaylistService.getPlaylistById(
                pl._id || pl.id,
              );
              return detailed.playlist || detailed.data || detailed;
            } catch {
              return pl;
            }
          }),
        );

        if (!cancelled) setPlaylists(detailedPlaylists);
      } catch (err) {
        console.error("Failed to load playlists for profile:", err);
      } finally {
        if (!cancelled) setPlaylistsLoading(false);
      }
    };

    fetchPlaylists();
    return () => {
      cancelled = true;
    };
  }, [activeTab, isOwnProfile, profile?.id]);

  // ── Fetch albums when the Albums tab is activated ───────────────────────────
  useEffect(() => {
    if (activeTab !== "Albums") return;
    if (!profile?.id) return;

    let cancelled = false;

    const fetchAlbums = async () => {
      setAlbumsLoading(true);
      try {
        const data = await PulsifyAlbumService.getArtistAlbums(profile.id);
        const rawAlbums =
          data.albums || data.data || (Array.isArray(data) ? data : []);

        const detailedAlbums = await Promise.all(
          rawAlbums.map(async (alb) => {
            try {
              const detailed = await PulsifyAlbumService.getAlbumById(
                alb._id || alb.id,
              );
              return detailed.album || detailed.data || detailed;
            } catch {
              return alb;
            }
          }),
        );

        if (!cancelled) setAlbums(detailedAlbums);
      } catch (err) {
        console.error("Failed to load albums for profile:", err);
      } finally {
        if (!cancelled) setAlbumsLoading(false);
      }
    };

    fetchAlbums();
    return () => {
      cancelled = true;
    };
  }, [activeTab, profile?.id]);

  // ── Track engagement event listener ────────────────────────────────────────
  useEffect(() => {
    const handleTrackEngagementUpdate = (event) => {
      const { trackId, track, viewerHasLiked, previousViewerHasLiked } =
        event.detail ?? {};

      if (!trackId) return;

      const snapshot = mergeTrackSnapshot(track, { viewerHasLiked });
      applyTrackSnapshot(trackId, snapshot);

      if (previousViewerHasLiked !== viewerHasLiked) {
        setProfile((current) =>
          current
            ? {
                ...current,
                likesCount: Math.max(
                  Number(current.likesCount ?? 0) + (viewerHasLiked ? 1 : -1),
                  0,
                ),
              }
            : current,
        );
      }
    };

    window.addEventListener(
      "pulsify:track-engagement-updated",
      handleTrackEngagementUpdate,
    );
    return () => {
      window.removeEventListener(
        "pulsify:track-engagement-updated",
        handleTrackEngagementUpdate,
      );
    };
  });

  // ── Library track helpers ───────────────────────────────────────────────────
  const findLocalTrackSnapshot = (trackId) =>
    recentTracks.find((track) => track.id === trackId) ??
    historyTracks.find((track) => track.id === trackId) ??
    likedTracks.find((track) => track.id === trackId) ??
    repostedTracks.find((track) => track.id === trackId) ??
    null;

  const resolveTrackSnapshot = async (trackId) => {
    const localTrack = findLocalTrackSnapshot(trackId);
    if (localTrack) return mergeTrackSnapshot(localTrack);

    try {
      return mergeTrackSnapshot(await getTrack(trackId));
    } catch {
      return mergeTrackSnapshot({ id: trackId });
    }
  };

  const applyTrackSnapshot = (trackId, snapshot) => {
    setRecentTracks((current) =>
      updateCollectionTrack(current, trackId, snapshot),
    );
    setHistoryTracks((current) =>
      updateCollectionTrack(current, trackId, snapshot),
    );
    setLikedTracks((current) => {
      const withoutTrack = removeTrackFromCollection(current, trackId);
      if (!snapshot.viewerHasLiked) return withoutTrack;
      const existingTrack = current.find((track) => track.id === trackId);
      return [
        mergeTrackSnapshot(existingTrack ?? snapshot, snapshot),
        ...withoutTrack,
      ];
    });
    setRepostedTracks((current) => {
      const withoutTrack = removeTrackFromCollection(current, trackId);
      if (!snapshot.viewerHasReposted) return withoutTrack;
      const existingTrack = current.find((track) => track.id === trackId);
      return [
        mergeTrackSnapshot(existingTrack ?? snapshot, snapshot),
        ...withoutTrack,
      ];
    });

    if (currentTrackRef.current?.id === trackId) {
      syncCurrentTrack?.(snapshot);
    }
  };

  const setPendingTrackState = (setter, trackId, value) => {
    setter((current) => ({ ...current, [trackId]: value }));
  };

  const isTrackOwnedByProfile = (track) => {
    const artistName = String(track?.artist ?? "")
      .trim()
      .toLowerCase();
    const profileName = String(profile?.displayName ?? "")
      .trim()
      .toLowerCase();
    return Boolean(artistName && profileName && artistName === profileName);
  };

  // ── Like / repost / delete handlers ────────────────────────────────────────
  const handleLikeToggle = async (trackId) => {
    if (!trackId || pendingLikeTrackIds[trackId]) return;

    const originalTrack = await resolveTrackSnapshot(trackId);
    const shouldLike = !originalTrack.viewerHasLiked;
    const nextTrackSnapshot = {
      ...originalTrack,
      viewerHasLiked: shouldLike,
      likeCount: Math.max(originalTrack.likeCount + (shouldLike ? 1 : -1), 0),
    };

    setPendingTrackState(setPendingLikeTrackIds, trackId, true);
    applyTrackSnapshot(trackId, nextTrackSnapshot);
    setProfile((current) =>
      current
        ? {
            ...current,
            likesCount: Math.max(
              Number(current.likesCount ?? 0) + (shouldLike ? 1 : -1),
              0,
            ),
          }
        : current,
    );

    try {
      await toggleLike(trackId, shouldLike);
    } catch (error) {
      console.error("Failed to toggle like from profile surface.", error);
      applyTrackSnapshot(trackId, originalTrack);
      setProfile((current) =>
        current
          ? {
              ...current,
              likesCount: Math.max(
                Number(current.likesCount ?? 0) + (shouldLike ? -1 : 1),
                0,
              ),
            }
          : current,
      );
    } finally {
      setPendingTrackState(setPendingLikeTrackIds, trackId, false);
    }
  };

  const handleRepostToggle = async (trackId) => {
    if (!trackId || pendingRepostTrackIds[trackId]) return;

    const originalTrack = await resolveTrackSnapshot(trackId);
    const shouldRepost = !originalTrack.viewerHasReposted;
    const nextTrackSnapshot = {
      ...originalTrack,
      viewerHasReposted: shouldRepost,
      repostCount: Math.max(
        originalTrack.repostCount + (shouldRepost ? 1 : -1),
        0,
      ),
    };

    setPendingTrackState(setPendingRepostTrackIds, trackId, true);
    applyTrackSnapshot(trackId, nextTrackSnapshot);

    try {
      await toggleRepost(trackId, shouldRepost);
    } catch (error) {
      console.error("Failed to toggle repost from profile surface.", error);
      applyTrackSnapshot(trackId, originalTrack);
    } finally {
      setPendingTrackState(setPendingRepostTrackIds, trackId, false);
    }
  };

  const handleDeleteTrack = async (trackId) => {
    if (!trackId || pendingDeleteTrackIds[trackId]) return;

    const originalTrack = await resolveTrackSnapshot(trackId);
    const profileSnapshot = profile ? { ...profile } : null;
    const likedSnapshot = [...likedTracks];
    const repostSnapshot = [...repostedTracks];
    const recentSnapshot = [...recentTracks];
    const historySnapshot = [...historyTracks];

    setPendingTrackState(setPendingDeleteTrackIds, trackId, true);
    setLikedTracks((current) => removeTrackFromCollection(current, trackId));
    setRepostedTracks((current) => removeTrackFromCollection(current, trackId));
    setRecentTracks((current) => removeTrackFromCollection(current, trackId));
    setHistoryTracks((current) => removeTrackFromCollection(current, trackId));
    setProfile((current) => {
      if (!current) return current;
      const nextValue = { ...current };
      if (originalTrack.viewerHasLiked) {
        nextValue.likesCount = Math.max(Number(current.likesCount ?? 0) - 1, 0);
      }
      if (isTrackOwnedByProfile(originalTrack)) {
        nextValue.trackCount = Math.max(Number(current.trackCount ?? 0) - 1, 0);
      }
      return nextValue;
    });

    try {
      await deleteTrack(trackId);
      return true;
    } catch (error) {
      console.error("Failed to delete track from profile surface.", error);
      setLikedTracks(likedSnapshot);
      setRepostedTracks(repostSnapshot);
      setRecentTracks(recentSnapshot);
      setHistoryTracks(historySnapshot);
      setProfile(profileSnapshot);
      return false;
    } finally {
      setPendingTrackState(setPendingDeleteTrackIds, trackId, false);
    }
  };

  // ── Profile update handlers ─────────────────────────────────────────────────
  async function handleSave(payload) {
    try {
      const updated = await profileService.updateMyProfile(payload);
      setProfile(updated);
      closeModal();
    } catch (error) {
      setErrorMessage(error?.message || "Failed to update profile.");
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

  // ── Tab content for Albums and Playlists (from main) ───────────────────────
  const getTabContent = () => {
    if (activeTab === "Playlists") {
      if (playlistsLoading) {
        return (
          <div
            style={{ color: "#999", padding: "40px 0", textAlign: "center" }}
          >
            Loading playlists...
          </div>
        );
      }
      if (playlists.length === 0) {
        return (
          <div
            style={{ color: "#999", padding: "40px 0", textAlign: "center" }}
          >
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
              onDelete={(id) =>
                setPlaylists((prev) =>
                  prev.filter((p) => (p._id || p.id) !== id),
                )
              }
            />
          ))}
        </div>
      );
    }

    if (activeTab === "Albums") {
      if (albumsLoading) {
        return (
          <div
            style={{ color: "#999", padding: "40px 0", textAlign: "center" }}
          >
            Loading albums...
          </div>
        );
      }
      if (albums.length === 0) {
        return (
          <div
            style={{ color: "#999", padding: "40px 0", textAlign: "center" }}
          >
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
              onDelete={(id) =>
                setAlbums((prev) => prev.filter((a) => (a._id || a.id) !== id))
              }
            />
          ))}
        </div>
      );
    }

    return null;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
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
        // Tab state (main)
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabContent={getTabContent()}
        // Library surfaces (integrated)
        likedTracks={likedTracks}
        repostedTracks={repostedTracks}
        recentTracks={recentTracks}
        historyTracks={historyTracks}
        isLibraryLoading={isLibraryLoading}
        onLikeToggle={handleLikeToggle}
        onRepostToggle={handleRepostToggle}
        onDeleteTrack={handleDeleteTrack}
        pendingLikeTrackIds={pendingLikeTrackIds}
        pendingRepostTrackIds={pendingRepostTrackIds}
        pendingDeleteTrackIds={pendingDeleteTrackIds}
      />

      {isOpen && (
        <div
          className={`sc-overlay ${isAnimating ? "overlay--in" : "overlay--out"}`}
          onClick={closeModal}
        >
          <div
            className={`sc-modal ${isAnimating ? "modal--in" : "modal--out"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="sc-modal-close"
              type="button"
              onClick={closeModal}
            >
              ×
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
