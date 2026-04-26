import { useEffect, useRef, useState } from "react";
import ProfileCard from "../components/ProfileCard";
import EditProfileForm from "../components/EditProfileForm";
import { profileService } from "../services/profileService";
import { usePlayer } from "@/hooks/usePlayer";
import {
  deleteTrack,
  getListeningHistory,
  getRecentlyPlayed,
  getTrack,
  getViewerLikedTracks,
  getViewerRepostedTracks,
  toggleLike,
  toggleRepost,
} from "@/services/api";
import "./ProfilePage.css";

const mergeTrackSnapshot = (track = {}, detail = {}) => ({
  ...track,
  ...detail,
  id: detail.id ?? track.id,
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
  viewerHasReposted: Boolean(detail.viewerHasReposted ?? track.viewerHasReposted),
});

const enrichLibraryEntry = (entry, detail = {}) => {
  const mergedTrack = mergeTrackSnapshot(entry, detail);

  return {
    ...mergedTrack,
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
    track.id === trackId
      ? {
          ...track,
          ...snapshot,
        }
      : track,
  );

const removeTrackFromCollection = (collection, trackId) =>
  collection.filter((track) => track.id !== trackId);

const getPlayedAtTime = (entry = {}) => {
  const timestamp = new Date(entry.played_at ?? entry.playedAt ?? 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortLibraryEntriesByPlayedAt = (entries = []) =>
  [...entries].sort((left, right) => getPlayedAtTime(right) - getPlayedAtTime(left));

const dedupeLibraryEntriesByTrack = (entries = []) => {
  const entryMap = new Map();

  sortLibraryEntriesByPlayedAt(entries).forEach((entry) => {
    if (!entry?.id || entryMap.has(entry.id)) return;
    entryMap.set(entry.id, entry);
  });

  return [...entryMap.values()];
};

export default function ProfilePage() {
  const { currentTrack, isPlaying, syncCurrentTrack } = usePlayer();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [likedTracks, setLikedTracks] = useState([]);
  const [repostedTracks, setRepostedTracks] = useState([]);
  const [recentTracks, setRecentTracks] = useState([]);
  const [historyTracks, setHistoryTracks] = useState([]);
  const [pendingLikeTrackIds, setPendingLikeTrackIds] = useState({});
  const [pendingRepostTrackIds, setPendingRepostTrackIds] = useState({});
  const [pendingDeleteTrackIds, setPendingDeleteTrackIds] = useState({});
  const currentTrackRef = useRef(null);
  const lastPinnedRecentTrackIdRef = useRef("");

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

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

  useEffect(() => {
    async function loadLibrarySurfaces() {
      try {
        setIsLibraryLoading(true);
        const [likes, reposts, recentEntries, historyEntries] = await Promise.all([
          getViewerLikedTracks(),
          getViewerRepostedTracks(),
          getRecentlyPlayed(),
          getListeningHistory(),
        ]);
        const trackIds = [
          ...new Set(
            [...likes, ...reposts, ...recentEntries, ...historyEntries]
              .map((entry) => entry.id)
              .filter(Boolean),
          ),
        ];

        const detailResults = await Promise.allSettled(
          trackIds.map((trackId) => getTrack(trackId)),
        );
        const detailMap = new Map();

        detailResults.forEach((result, index) => {
          if (result.status === "fulfilled") {
            detailMap.set(trackIds[index], result.value);
          }
        });

        setLikedTracks(
          likes.map((entry) => mergeTrackSnapshot(entry, detailMap.get(entry.id))),
        );
        setRepostedTracks(
          reposts.map((entry) => mergeTrackSnapshot(entry, detailMap.get(entry.id))),
        );
        setRecentTracks(
          dedupeLibraryEntriesByTrack(
            recentEntries.map((entry) =>
              enrichLibraryEntry(entry, detailMap.get(entry.id)),
            ),
          ),
        );
        setHistoryTracks(
          sortLibraryEntriesByPlayedAt(
            historyEntries.map((entry) =>
              enrichLibraryEntry(entry, detailMap.get(entry.id)),
            ),
          ),
        );
      } catch (error) {
        console.error("Failed to load engagement surfaces.", error);
      } finally {
        setIsLibraryLoading(false);
      }
    }

    loadLibrarySurfaces();
  }, []);

  useEffect(() => {
    const activeTrack = currentTrackRef.current;

    if (isLibraryLoading || !isPlaying || !activeTrack?.id) return;

    if (lastPinnedRecentTrackIdRef.current === activeTrack.id) return;

    lastPinnedRecentTrackIdRef.current = activeTrack.id;
    const playedAt = new Date().toISOString();

    setRecentTracks((current) => {
      const existingTrack = current.find((track) => track.id === activeTrack.id);
      const nextTrack = enrichLibraryEntry(
        {
          ...(existingTrack ?? {}),
          ...activeTrack,
          played_at: playedAt,
          playedAt,
          duration_played_ms: Math.max(Number(activeTrack.duration ?? 0) * 1000, 0),
        },
        activeTrack,
      );

      return [
        nextTrack,
        ...current.filter((track) => track.id !== activeTrack.id),
      ].slice(0, 8);
    });
    setHistoryTracks((current) => {
      const existingTrack = current.find((track) => track.id === activeTrack.id);
      const nextTrack = enrichLibraryEntry(
        {
          ...(existingTrack ?? {}),
          ...activeTrack,
          played_at: playedAt,
          playedAt,
          duration_played_ms: Math.max(Number(activeTrack.duration ?? 0) * 1000, 0),
        },
        activeTrack,
      );

      return [nextTrack, ...current];
    });
  }, [currentTrack?.id, isLibraryLoading, isPlaying]);

  const findLocalTrackSnapshot = (trackId) =>
    recentTracks.find((track) => track.id === trackId) ??
    historyTracks.find((track) => track.id === trackId) ??
    likedTracks.find((track) => track.id === trackId) ??
    repostedTracks.find((track) => track.id === trackId) ??
    null;

  const resolveTrackSnapshot = async (trackId) => {
    const localTrack = findLocalTrackSnapshot(trackId);
    if (localTrack) {
      return mergeTrackSnapshot(localTrack);
    }

    try {
      return mergeTrackSnapshot(await getTrack(trackId));
    } catch {
      return mergeTrackSnapshot({ id: trackId });
    }
  };

  const applyTrackSnapshot = (trackId, snapshot) => {
    setRecentTracks((current) => updateCollectionTrack(current, trackId, snapshot));
    setHistoryTracks((current) => updateCollectionTrack(current, trackId, snapshot));
    setLikedTracks((current) => {
      const withoutTrack = removeTrackFromCollection(current, trackId);

      if (!snapshot.viewerHasLiked) {
        return withoutTrack;
      }

      const existingTrack = current.find((track) => track.id === trackId);
      return [mergeTrackSnapshot(existingTrack ?? snapshot, snapshot), ...withoutTrack];
    });
    setRepostedTracks((current) => {
      const withoutTrack = removeTrackFromCollection(current, trackId);

      if (!snapshot.viewerHasReposted) {
        return withoutTrack;
      }

      const existingTrack = current.find((track) => track.id === trackId);
      return [mergeTrackSnapshot(existingTrack ?? snapshot, snapshot), ...withoutTrack];
    });

    if (currentTrackRef.current?.id === trackId) {
      syncCurrentTrack?.(snapshot);
    }
  };

  useEffect(() => {
    const handleTrackEngagementUpdate = (event) => {
      const {
        trackId,
        track,
        viewerHasLiked,
        previousViewerHasLiked,
      } = event.detail ?? {};

      if (!trackId) return;

      const snapshot = mergeTrackSnapshot(track, {
        viewerHasLiked,
      });

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

  const setPendingTrackState = (setter, trackId, value) => {
    setter((current) => ({
      ...current,
      [trackId]: value,
    }));
  };

  const isTrackOwnedByProfile = (track) => {
    const artistName = String(track?.artist ?? "").trim().toLowerCase();
    const profileName = String(profile?.displayName ?? "").trim().toLowerCase();
    return Boolean(artistName && profileName && artistName === profileName);
  };

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
      repostCount: Math.max(originalTrack.repostCount + (shouldRepost ? 1 : -1), 0),
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

  async function handleSave(payload) {
    try {
      const updated = await profileService.updateMyProfile(payload);
      setProfile(updated);
      closeModal();
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

  function openModal() {
    setIsOpen(true);
    setTimeout(() => setIsAnimating(true), 10);
  }

  function closeModal() {
    setIsAnimating(false);
    setTimeout(() => setIsOpen(false), 400);
  }

  if (isLoading) return <div className="sc-loading">Loading profile...</div>;
  if (errorMessage) return <div className="sc-error">{errorMessage}</div>;
  if (!profile) return <div className="sc-error">No profile found.</div>;

  return (
    <div className="sc-profile-page">
      <ProfileCard
        profile={profile}
        onEditClick={openModal}
        onCoverUpload={handleCoverUpload}
        onAvatarUpload={handleAvatarUpload}
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
            <button className="sc-modal-close" type="button" onClick={closeModal}>
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
