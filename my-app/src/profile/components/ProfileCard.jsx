import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { buildTrackQueueIds } from "../../config/trackCatalog";
import { socialService } from "../../social/services/socialService";
import FollowButton from "../../social/components/FollowButton";
import BlockModal from "../../social/components/BlockModal";
import { PlatformIcon, detectPlatform } from "./SocialPlatforms";
import { usePlayer } from "../../hooks/usePlayer";

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
  { label: "All", path: null, libraryTab: "all" },
  { label: "Popular tracks", path: null, libraryTab: "popular-tracks" },
  { label: "Tracks", path: null },
  { label: "Albums", path: null },
  { label: "Playlists", path: null },
  { label: "Reposts", path: null, libraryTab: "reposts" },
];

// ─── Social link helpers (from integrated) ────────────────────────────────────
const PROFILE_LINK_LABELS = {
  instagram: "Instagram",
  twitter: "Twitter",
  x: "X",
  website: "Website",
  support: "Support",
  support_link: "Support",
  supportlink: "Support",
};

const QUICK_NAV_ITEMS = [
  { label: "My Feed", path: "/feed", icon: "feed" },
  { label: "Discover", path: "/discover", icon: "discover" },
  { label: "Trending", path: "/trending", icon: "trending" },
  { label: "Go Pro", path: "/premium", icon: "premium", premium: true },
];

const resolveLibraryTabLabel = (tabValue) => {
  if (tabValue === "popular-tracks" || tabValue === "likes")
    return "Popular tracks";
  if (tabValue === "reposts") return "Reposts";
  return "All";
};

const formatProfileLinkLabel = (key) => {
  const normalizedKey = String(key ?? "")
    .trim()
    .toLowerCase();
  if (PROFILE_LINK_LABELS[normalizedKey])
    return PROFILE_LINK_LABELS[normalizedKey];
  return String(key ?? "Link")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const normalizeProfileLinkUrl = (value) => {
  const url = String(value ?? "").trim();
  if (!url) return "";
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  return `https://${url.replace(/^\/+/, "")}`;
};

const getProfileLinks = (socialLinks = {}) => {
  const entries = Array.isArray(socialLinks)
    ? socialLinks.map((link, index) => [
        link.key ?? link.label ?? `link_${index + 1}`,
        link,
      ])
    : Object.entries(socialLinks ?? {});

  return entries
    .flatMap(([key, value]) => {
      // Handle links array (e.g. socialLinks.links = [{platform, url, isSupport}])
      if (Array.isArray(value)) {
        return value
          .filter((item) => item?.url)
          .map((item) => ({
            key: item.key ?? item.platform ?? key,
            href: normalizeProfileLinkUrl(item.url),
            label: item.label ?? formatProfileLinkLabel(item.platform ?? key),
            platform: item.platform,
          }))
          .filter((link) => link.href);
      }
      const isStructuredValue = value && typeof value === "object";
      const rawUrl = isStructuredValue
        ? (value.url ?? value.href ?? "")
        : value;
      const href = normalizeProfileLinkUrl(rawUrl);
      if (!href) return [];
      return [
        {
          key,
          href,
          label: isStructuredValue
            ? (value.label ?? formatProfileLinkLabel(key))
            : formatProfileLinkLabel(key),
          platform: isStructuredValue ? value.platform : detectPlatform(href),
        },
      ];
    })
    .filter(Boolean);
};

// ─── Track display helpers (from integrated) ──────────────────────────────────
const DEFAULT_TRACK_ART =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=900&auto=format&fit=crop";

const formatDuration = (seconds) => {
  const numericSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(numericSeconds / 60);
  const remainingSeconds = numericSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatRelativePlayedAt = (value) => {
  if (!value) return "Just now";
  const playedAt = new Date(value);
  if (Number.isNaN(playedAt.getTime())) return "Just now";
  const secondsDifference = Math.round(
    (playedAt.getTime() - Date.now()) / 1000,
  );
  const absSeconds = Math.abs(secondsDifference);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (absSeconds < 60) return formatter.format(secondsDifference, "second");
  const minutesDifference = Math.round(secondsDifference / 60);
  if (Math.abs(minutesDifference) < 60)
    return formatter.format(minutesDifference, "minute");
  const hoursDifference = Math.round(minutesDifference / 60);
  if (Math.abs(hoursDifference) < 24)
    return formatter.format(hoursDifference, "hour");
  const daysDifference = Math.round(hoursDifference / 24);
  if (Math.abs(daysDifference) < 30)
    return formatter.format(daysDifference, "day");
  const monthsDifference = Math.round(daysDifference / 30);
  if (Math.abs(monthsDifference) < 12)
    return formatter.format(monthsDifference, "month");
  return formatter.format(Math.round(daysDifference / 365), "year");
};

const createWaveform = (seedSource, length = 110) => {
  const seed = String(seedSource ?? "track")
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return Array.from({ length }, (_, index) => {
    const primary = (Math.sin((index + seed) * 0.41) + 1) / 2;
    const secondary = (Math.cos((index + seed) * 0.18) + 1) / 2;
    return Number((0.18 + primary * 0.48 + secondary * 0.14).toFixed(3));
  });
};

const getPlaybackStateLabel = (value, previewDurationSeconds = 0) => {
  if (value === "Blocked") return "Blocked";
  if (value === "Preview") {
    return previewDurationSeconds
      ? `Preview only - ${previewDurationSeconds}s`
      : "Preview only";
  }
  return "Playable";
};

const getPlaybackStateTone = (value) => {
  if (value === "Blocked") return "is-blocked";
  if (value === "Preview") return "is-preview";
  return "is-playable";
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const PlayGlyph = ({ isPlaying = false }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    {isPlaying ? (
      <>
        <rect x="6" y="5" width="4" height="14" rx="1.5" />
        <rect x="14" y="5" width="4" height="14" rx="1.5" />
      </>
    ) : (
      <path d="M8 5.14v13.72a1 1 0 0 0 1.51.86l10.5-6.86a1 1 0 0 0 0-1.72L9.51 4.28A1 1 0 0 0 8 5.14Z" />
    )}
  </svg>
);

const StatPlayIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M8 5.14v13.72a1 1 0 0 0 1.51.86l10.5-6.86a1 1 0 0 0 0-1.72L9.51 4.28A1 1 0 0 0 8 5.14Z" />
  </svg>
);

const HeartIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
  </svg>
);

const RepostIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const CommentIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
  </svg>
);

const ShareIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
    <path d="M12 16V4" />
    <path d="m7 9 5-5 5 5" />
  </svg>
);

const CopyIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const LinkIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L10.7 5.23" />
    <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l2.13-2.13" />
  </svg>
);

const MoreIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
  </svg>
);

const QueueIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 6h12" />
    <path d="M4 12h12" />
    <path d="M4 18h12" />
    <path d="m18 15 3 3-3 3" />
    <path d="M21 18h-5" />
  </svg>
);

const PlaylistIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 6h14" />
    <path d="M4 12h14" />
    <path d="M4 18h8" />
    <path d="M18 15v6" />
    <path d="M15 18h6" />
  </svg>
);

const InsightsIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 20V10" />
    <path d="M12 20V4" />
    <path d="M19 20v-7" />
  </svg>
);

const StationIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="2.5" />
    <path d="M4.93 4.93a10 10 0 0 1 14.14 0" />
    <path d="M7.76 7.76a6 6 0 0 1 8.48 0" />
  </svg>
);

const DistributeIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 19h16" />
    <path d="M7 19V9" />
    <path d="M12 19V5" />
    <path d="M17 19v-7" />
  </svg>
);

const DeleteIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

const FeedNavIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 18V5l10-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="16" cy="16" r="3" />
  </svg>
);

const DiscoverNavIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

const TrendingNavIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 17 10 11l4 4 6-8" />
    <path d="M15 7h5v5" />
  </svg>
);

const PremiumNavIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="m12 2.75 2.74 5.55 6.13.89-4.44 4.33 1.05 6.11L12 16.75l-5.48 2.88 1.05-6.11-4.44-4.33 6.13-.89L12 2.75Z" />
  </svg>
);

const QUICK_NAV_ICONS = {
  feed: FeedNavIcon,
  discover: DiscoverNavIcon,
  trending: TrendingNavIcon,
  premium: PremiumNavIcon,
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function TrackMetricLink({ to, icon, label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <Link
      className="sc-track-metric sc-track-metric-link"
      to={to}
      title={label}
    >
      {icon}
      <span>{value}</span>
    </Link>
  );
}

function RecentWaveform({ track, isActive, currentTime, onSeek }) {
  const waveform =
    Array.isArray(track.waveform) && track.waveform.length
      ? track.waveform
      : createWaveform(track.id ?? track.title);

  const playedProgress =
    track.duration > 0
      ? Math.min(
          Number(track.duration_played_ms ?? track.durationPlayedMs ?? 0) /
            1000 /
            track.duration,
          1,
        )
      : 0;

  const progressRatio =
    isActive && track.duration > 0
      ? Math.min(currentTime / track.duration, 1)
      : playedProgress;

  return (
    <div
      className="sc-recent-wave-shell"
      aria-label={`Waveform for ${track.title}`}
    >
      <div className="sc-recent-waveform" aria-hidden="true">
        {waveform.map((point, index) => {
          const nextTime =
            track.duration > 0
              ? (index / Math.max(waveform.length - 1, 1)) * track.duration
              : 0;
          const progressIndex = Math.round(progressRatio * waveform.length);
          const isPassed = index <= progressIndex;
          return (
            <button
              key={`${track.id}-wave-${index}`}
              className={`sc-recent-wave-bar ${isPassed ? "is-active" : ""}`}
              type="button"
              style={{ "--wave-height": `${Math.max(point * 100, 12)}%` }}
              onClick={(event) => {
                event.stopPropagation();
                onSeek(nextTime);
              }}
              aria-label={`Seek ${track.title} to ${formatDuration(nextTime)}`}
            />
          );
        })}
      </div>
      <span className="sc-recent-duration">
        {formatDuration(track.duration)}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProfileCard({
  profile,
  onEditClick,
  onCoverUpload,
  onAvatarUpload,
  // From main: album/playlist tab support
  isOwnProfile = true,
  activeTab = "All",
  onTabChange,
  tabContent,
  // From integrated: library surfaces
  likedTracks = [],
  repostedTracks = [],
  recentTracks = [],
  historyTracks = [],
  isLibraryLoading = false,
  onLikeToggle,
  onRepostToggle,
  onDeleteTrack,
  pendingLikeTrackIds = {},
  pendingRepostTrackIds = {},
  pendingDeleteTrackIds = {},
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    queueTrackIds,
    loadTrack,
    togglePlay,
    seekTo,
    setQueueTrackIds,
    setPlayerMessage,
  } = usePlayer();

  const [socialCounts, setSocialCounts] = useState({
    followersCount: 0,
    followingCount: 0,
    blockedCount: 0,
  });

  // From main: block modal
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const moreMenuRef = useRef(null);

  // From integrated: track action menus
  const actionMenuRef = useRef(null);
  const [openActionMenuTrackId, setOpenActionMenuTrackId] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  // Active tab logic: library route uses URL param, profile uses local state
  const isLibraryRoute = location.pathname.startsWith("/library");
  const activeSurfaceTab = isLibraryRoute
    ? resolveLibraryTabLabel(searchParams.get("tab"))
    : activeTab;

  const profileTrackQueue = [
    ...new Set(
      [...recentTracks, ...historyTracks, ...likedTracks, ...repostedTracks]
        .map((track) => track.id)
        .filter(Boolean),
    ),
  ];

  const featuredRecentTrack = recentTracks[0] ?? null;
  const currentTrackId = currentTrack?.id ?? "";
  const visibleHistoryTracks = historyTracks.slice(0, 6);
  const visibleLikedTracks = likedTracks.slice(0, 3);
  const showEmptyLibraryState =
    !isLibraryLoading &&
    !recentTracks.length &&
    !historyTracks.length &&
    !likedTracks.length &&
    !repostedTracks.length;

  const profileTrackCount =
    Number(profile.trackCount ?? 0) ||
    new Set(historyTracks.map((track) => track.id).filter(Boolean)).size;
  const likeRailCount = Number(profile.likesCount ?? 0) || likedTracks.length;
  const hasFooterMeta = Boolean(profile.bio || profile.favoriteGenres?.length);
  const profileLinks = getProfileLinks(profile.socialLinks);

  const formatCount = (value) => {
    const numericValue = Number(value) || 0;
    if (numericValue >= 1000000)
      return `${(numericValue / 1000000).toFixed(1)}M`;
    if (numericValue >= 1000) return `${Math.round(numericValue / 100) / 10}K`;
    return `${numericValue}`;
  };

  // ── From main: close more-menu on outside click ─────────────────────────────
  useEffect(() => {
    if (!showMoreMenu) return;
    function handleClickOutside(e) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setShowMoreMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMoreMenu]);

  // ── From integrated: keyboard and outside-click for action menus ────────────
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpenActionMenuTrackId("");
      setDeleteCandidate(null);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!openActionMenuTrackId) return undefined;
    const handlePointerDown = (event) => {
      if (actionMenuRef.current?.contains(event.target)) return;
      setOpenActionMenuTrackId("");
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [openActionMenuTrackId]);

  // ── From main: social counts + block ───────────────────────────────────────
  useEffect(() => {
    async function loadCounts() {
      try {
        const data = await socialService.getSocialCounts(profile.id);
        setSocialCounts(data);
      } catch (error) {
        console.error("Failed to load social counts:", error);
      }
    }
    if (profile?.id) loadCounts();
  }, [profile?.id]);

  async function handleBlockConfirm(userId, reason) {
    await socialService.blockUser(userId, reason);
    setIsBlocked(true);
    setShowBlockModal(false);
  }

  // ── From integrated: track playback handlers ────────────────────────────────
  const handleTrackPlayback = async (track, options = {}) => {
    if (!track) return;
    if (currentTrackId === track.id && options.startTime == null) {
      await togglePlay();
      return;
    }
    await loadTrack(track, {
      queueIds: profileTrackQueue,
      playbackContext: "profile",
      autoplay: options.autoplay ?? true,
      ...(typeof options.startTime === "number"
        ? { startTime: options.startTime }
        : {}),
    });
  };

  const handleTrackSeek = async (track, nextValue) => {
    if (!track?.duration) return;
    if (currentTrackId === track.id) {
      seekTo(nextValue);
      return;
    }
    await loadTrack(track, {
      queueIds: profileTrackQueue,
      playbackContext: "profile",
      autoplay: false,
      startTime: nextValue,
    });
  };

  const handleCopyTrackLink = async (track) => {
    if (!navigator?.clipboard?.writeText) {
      setPlayerMessage?.("Copy is not supported in this browser.");
      return;
    }
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5173";
    try {
      await navigator.clipboard.writeText(`${origin}/tracks/${track.id}`);
      setPlayerMessage?.("Track link copied.");
    } catch {
      setPlayerMessage?.("Could not copy the track link.");
    }
  };

  const handleShareTrack = async (track) => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5173";
    const trackUrl = `${origin}/tracks/${track.id}`;
    if (navigator?.share) {
      try {
        await navigator.share({
          title: track.title,
          text: `${track.artist} - ${track.title}`,
          url: trackUrl,
        });
        setPlayerMessage?.("Share sheet opened.");
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    await handleCopyTrackLink(track);
  };

  const handleShareProfile = async () => {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:5173";
    const profileUrl = `${origin}${profile.username ? `/profile/${profile.username}` : "/profile"}`;
    if (navigator?.share) {
      try {
        await navigator.share({
          title: profile.displayName,
          text: `${profile.displayName} on Pulsify`,
          url: profileUrl,
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    if (!navigator?.clipboard?.writeText) {
      setPlayerMessage?.("Copy is not supported in this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(profileUrl);
      setPlayerMessage?.("Profile link copied.");
    } catch {
      setPlayerMessage?.("Could not copy the profile link.");
    }
  };

  const handleOpenTrack = (track) => {
    if (track?.id) navigate(`/tracks/${track.id}`);
  };

  const handleAddToNextUp = (track) => {
    const nextQueueIds = buildTrackQueueIds(
      queueTrackIds.length ? queueTrackIds : profileTrackQueue,
      track?.id,
    );
    setQueueTrackIds(nextQueueIds);
    setPlayerMessage?.(`${track.title} added to Next up.`);
    setOpenActionMenuTrackId("");
  };

  const handleAddToPlaylist = (track) => {
    setPlayerMessage?.(
      `Playlist actions are not wired yet for ${track.title}.`,
    );
    setOpenActionMenuTrackId("");
  };

  const handleOpenStation = (track) => {
    setPlayerMessage?.(`Station started from ${track.title}.`);
    setOpenActionMenuTrackId("");
    navigate("/feed");
  };

  const handleDistributeTrack = (track) => {
    setPlayerMessage?.(`${track.title} is ready when distribution is wired.`);
    setOpenActionMenuTrackId("");
  };

  const handleLikeFromMenu = async (track) => {
    if (!track?.id || !onLikeToggle) return;
    await onLikeToggle(track.id);
    setOpenActionMenuTrackId("");
  };

  const handleRepostFromAction = async (track) => {
    if (!track?.id || !onRepostToggle) return;
    await onRepostToggle(track.id);
  };

  const handleDeletePrompt = (track) => {
    setDeleteCandidate(track);
    setOpenActionMenuTrackId("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate?.id || !onDeleteTrack) return;
    const wasDeleted = await onDeleteTrack(deleteCandidate.id);
    if (wasDeleted === false) {
      setPlayerMessage?.(
        `Could not delete ${deleteCandidate.title} right now.`,
      );
      return;
    }
    setPlayerMessage?.(`${deleteCandidate.title} deleted.`);
    setDeleteCandidate(null);
  };

  const handleJumpToSection = (sectionId) => {
    if (isLibraryRoute && sectionId === "profile-favorites") {
      navigate("/library?tab=likes");
      return;
    }
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderMetricLinks = (track, options = {}) => (
    <>
      <TrackMetricLink
        to={`/tracks/${track.id}`}
        icon={<StatPlayIcon />}
        label="Plays"
        value={formatCount(track.playCount)}
      />
      <TrackMetricLink
        to={`/tracks/${track.id}/likes`}
        icon={<HeartIcon />}
        label="Likes"
        value={formatCount(track.likeCount)}
      />
      <TrackMetricLink
        to={`/tracks/${track.id}/reposts`}
        icon={<RepostIcon />}
        label="Reposts"
        value={formatCount(track.repostCount)}
      />
      {options.includeComments ? (
        <TrackMetricLink
          to={`/tracks/${track.id}/comments`}
          icon={<CommentIcon />}
          label="Comments"
          value={formatCount(track.commentCount)}
        />
      ) : null}
    </>
  );

  const renderTrackRows = (tracks, emptyLabel, options = {}) => {
    const { limit = 4 } = options;
    if (isLibraryLoading)
      return <p className="sc-profile-empty-copy">Loading tracks...</p>;
    if (!tracks.length)
      return <p className="sc-profile-empty-copy">{emptyLabel}</p>;
    return tracks.slice(0, limit).map((track) => {
      const isActive = currentTrackId === track.id;
      return (
        <article
          className="sc-profile-track-row"
          key={`${track.id}-${track.played_at ?? track.title}`}
        >
          <button
            className={`sc-profile-track-play ${isActive && isPlaying ? "is-playing" : ""}`}
            type="button"
            onClick={() => handleTrackPlayback(track)}
          >
            <PlayGlyph isPlaying={isActive && isPlaying} />
          </button>
          <button
            className="sc-profile-track-cover"
            type="button"
            onClick={() => navigate(`/tracks/${track.id}`)}
          >
            <img src={track.cover || DEFAULT_TRACK_ART} alt={track.title} />
          </button>
          <div className="sc-profile-track-copy">
            <Link className="sc-profile-track-title" to={`/tracks/${track.id}`}>
              {track.title}
            </Link>
            <p>{track.artist}</p>
            <div className="sc-profile-track-meta-row">
              {track.playbackState ? (
                <span
                  className={`sc-inline-state ${getPlaybackStateTone(track.playbackState)}`}
                >
                  {getPlaybackStateLabel(
                    track.playbackState,
                    track.previewDurationSeconds,
                  )}
                </span>
              ) : null}
            </div>
          </div>
          <div className="sc-profile-track-stats">
            {renderMetricLinks(track, { includeComments: true })}
          </div>
        </article>
      );
    });
  };

  const renderLikesRail = () => {
    if (isLibraryLoading)
      return <p className="sc-profile-empty-copy">Loading liked tracks...</p>;
    if (!likedTracks.length)
      return (
        <p className="sc-profile-empty-copy">
          Like a few tracks and they will stack here.
        </p>
      );
    return visibleLikedTracks.map((track) => {
      const isActive = currentTrackId === track.id;
      return (
        <article className="sc-like-rail-card" key={`like-rail-${track.id}`}>
          <button
            className="sc-like-rail-cover"
            type="button"
            onClick={() => navigate(`/tracks/${track.id}`)}
          >
            <img src={track.cover || DEFAULT_TRACK_ART} alt={track.title} />
          </button>
          <div className="sc-like-rail-copy">
            <Link className="sc-like-rail-title" to={`/tracks/${track.id}`}>
              {track.title}
            </Link>
            <p>{track.artist}</p>
            <div className="sc-like-rail-stats">
              {renderMetricLinks(track, { includeComments: true })}
            </div>
          </div>
          <button
            className={`sc-like-rail-play ${isActive && isPlaying ? "is-playing" : ""}`}
            type="button"
            onClick={() => handleTrackPlayback(track)}
            aria-label={
              isActive && isPlaying
                ? `Pause ${track.title}`
                : `Play ${track.title}`
            }
          >
            <PlayGlyph isPlaying={isActive && isPlaying} />
          </button>
        </article>
      );
    });
  };

  const renderRecentHeroCard = (track, options = {}) => {
    const { keyPrefix = "recent" } = options;
    const actionKey = `${keyPrefix}-${track.id}`;
    const isCardActive = currentTrackId === track.id;
    const isActionMenuOpen = openActionMenuTrackId === actionKey;
    const isLikePending = Boolean(pendingLikeTrackIds[track.id]);
    const isRepostPending = Boolean(pendingRepostTrackIds[track.id]);
    const isDeletePending = Boolean(pendingDeleteTrackIds[track.id]);

    return (
      <article
        className={`sc-recent-hero ${isCardActive ? "is-current" : ""}`}
        key={`${keyPrefix}-${track.id}-${track.played_at ?? track.title}`}
      >
        <button
          className="sc-recent-cover"
          type="button"
          onClick={() => handleOpenTrack(track)}
        >
          <img src={track.cover || DEFAULT_TRACK_ART} alt={track.title} />
        </button>
        <div className="sc-recent-body">
          <div className="sc-recent-head">
            <div className="sc-recent-heading">
              <button
                className={`sc-recent-play-circle ${isCardActive && isPlaying ? "is-playing" : ""}`}
                type="button"
                onClick={() => handleTrackPlayback(track)}
                aria-label={
                  isCardActive && isPlaying
                    ? `Pause ${track.title}`
                    : `Play ${track.title}`
                }
              >
                <PlayGlyph isPlaying={isCardActive && isPlaying} />
              </button>
              <div className="sc-recent-title-group">
                <span className="sc-recent-artist">{track.artist}</span>
                <button
                  className="sc-recent-title-link"
                  type="button"
                  onClick={() => handleOpenTrack(track)}
                >
                  {track.title}
                </button>
              </div>
            </div>
            <div className="sc-recent-head-meta">
              <span>
                {formatRelativePlayedAt(track.played_at ?? track.playedAt)}
              </span>
              <span
                className={`sc-recent-state-pill ${getPlaybackStateTone(track.playbackState)}`}
              >
                {getPlaybackStateLabel(
                  track.playbackState,
                  track.previewDurationSeconds,
                )}
              </span>
            </div>
          </div>

          <RecentWaveform
            track={track}
            isActive={isCardActive}
            currentTime={currentTime}
            onSeek={(seconds) => handleTrackSeek(track, seconds)}
          />

          <div className="sc-recent-footer">
            <div className="sc-recent-actions">
              <button
                className="sc-recent-surface-btn"
                type="button"
                onClick={() => handleShareTrack(track)}
                aria-label={`Share ${track.title}`}
                title="Share"
                disabled={isDeletePending}
              >
                <ShareIcon />
              </button>
              <button
                className="sc-recent-surface-btn"
                type="button"
                onClick={() => handleCopyTrackLink(track)}
                aria-label={`Copy link for ${track.title}`}
                title="Copy link"
                disabled={isDeletePending}
              >
                <CopyIcon />
              </button>
              <button
                className={`sc-recent-surface-btn ${track.viewerHasReposted ? "is-active" : ""}`}
                type="button"
                onClick={() => handleRepostFromAction(track)}
                aria-label={
                  track.viewerHasReposted
                    ? `Undo repost ${track.title}`
                    : `Repost ${track.title}`
                }
                title={track.viewerHasReposted ? "Undo repost" : "Repost"}
                disabled={isRepostPending || isDeletePending}
              >
                <RepostIcon />
              </button>
              <button
                className="sc-recent-surface-btn"
                type="button"
                onClick={() => handleOpenTrack(track)}
                aria-label={`Open ${track.title}`}
                title="Open track"
                disabled={isDeletePending}
              >
                <LinkIcon />
              </button>

              <div
                className="sc-recent-action-stack"
                ref={isActionMenuOpen ? actionMenuRef : null}
              >
                <button
                  className={`sc-recent-surface-btn ${isActionMenuOpen ? "is-open" : ""}`}
                  type="button"
                  onClick={() =>
                    setOpenActionMenuTrackId((current) =>
                      current === actionKey ? "" : actionKey,
                    )
                  }
                  aria-label={`More actions for ${track.title}`}
                  title="More"
                  disabled={isDeletePending}
                >
                  <MoreIcon />
                </button>
                {isActionMenuOpen ? (
                  <div className="sc-recent-action-menu">
                    <button
                      className={`sc-recent-menu-item ${track.viewerHasLiked ? "is-active" : ""}`}
                      type="button"
                      onClick={() => handleLikeFromMenu(track)}
                      disabled={isLikePending || isDeletePending}
                    >
                      <HeartIcon />
                      <span>{track.viewerHasLiked ? "Liked" : "Like"}</span>
                    </button>
                    <button
                      className="sc-recent-menu-item"
                      type="button"
                      onClick={() => handleAddToNextUp(track)}
                      disabled={isDeletePending}
                    >
                      <QueueIcon />
                      <span>Add to Next up</span>
                    </button>
                    <button
                      className="sc-recent-menu-item"
                      type="button"
                      onClick={() => handleAddToPlaylist(track)}
                      disabled={isDeletePending}
                    >
                      <PlaylistIcon />
                      <span>Add to Playlist</span>
                    </button>
                    <button
                      className="sc-recent-menu-item"
                      type="button"
                      onClick={() => {
                        setOpenActionMenuTrackId("");
                        navigate("/history");
                      }}
                      disabled={isDeletePending}
                    >
                      <InsightsIcon />
                      <span>Your Insights</span>
                    </button>
                    <button
                      className="sc-recent-menu-item"
                      type="button"
                      onClick={() => handleOpenStation(track)}
                      disabled={isDeletePending}
                    >
                      <StationIcon />
                      <span>Station</span>
                    </button>
                    <button
                      className="sc-recent-menu-item"
                      type="button"
                      onClick={() => handleDistributeTrack(track)}
                      disabled={isDeletePending}
                    >
                      <DistributeIcon />
                      <span>Distribute</span>
                    </button>
                    {onDeleteTrack ? (
                      <button
                        className="sc-recent-menu-item is-danger"
                        type="button"
                        onClick={() => handleDeletePrompt(track)}
                        disabled={isDeletePending}
                      >
                        <DeleteIcon />
                        <span>Delete Track</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="sc-recent-stats">
              {renderMetricLinks(track, { includeComments: true })}
            </div>
          </div>
        </div>
      </article>
    );
  };

  const renderRecentSection = () => {
    if (isLibraryLoading)
      return (
        <p className="sc-profile-empty-copy">Loading recent sessions...</p>
      );
    if (!featuredRecentTrack)
      return (
        <p className="sc-profile-empty-copy">
          Play a track and it will show up here.
        </p>
      );
    return renderRecentHeroCard(featuredRecentTrack, {
      keyPrefix: "featured-recent",
    });
  };

  const renderHistorySection = () => {
    if (isLibraryLoading)
      return (
        <p className="sc-profile-empty-copy">Loading listening history...</p>
      );
    if (!visibleHistoryTracks.length)
      return (
        <p className="sc-profile-empty-copy">
          Play more tracks and your history will build here.
        </p>
      );
    return visibleHistoryTracks.map((track, index) =>
      renderRecentHeroCard(track, { keyPrefix: `history-${index}` }),
    );
  };

  const renderTabTrackList = (tracks, emptyLabel, keyPrefix) => {
    if (isLibraryLoading)
      return <p className="sc-profile-empty-copy">Loading tracks...</p>;
    if (!tracks.length)
      return <p className="sc-profile-empty-copy">{emptyLabel}</p>;
    return tracks.map((track, index) =>
      renderRecentHeroCard(track, { keyPrefix: `${keyPrefix}-${index}` }),
    );
  };

  // ── Tab content renderer ────────────────────────────────────────────────────
  const renderActiveTabContent = () => {
    // Albums and Playlists: delegate back to ProfilePage's tabContent prop (from main)
    if (activeSurfaceTab === "Albums" || activeSurfaceTab === "Playlists") {
      return tabContent ?? null;
    }

    if (activeSurfaceTab === "Popular tracks") {
      return (
        <section className="sc-profile-section sc-profile-section--recent">
          <div className="sc-profile-section-head">
            <div>
              <h2>
                {searchParams.get("tab") === "likes"
                  ? "Likes"
                  : "Popular tracks"}
              </h2>
              <p>Tracks you liked, shown with the same player controls.</p>
            </div>
          </div>
          <div className="sc-profile-tab-track-list">
            {renderTabTrackList(
              likedTracks,
              "Like tracks and they will appear here.",
              "popular-track",
            )}
          </div>
        </section>
      );
    }

    if (activeSurfaceTab === "Reposts") {
      return (
        <section className="sc-profile-section sc-profile-section--recent">
          <div className="sc-profile-section-head">
            <div>
              <h2>Reposts</h2>
              <p>Tracks you reposted, ready to play from your profile.</p>
            </div>
          </div>
          <div className="sc-profile-tab-track-list">
            {renderTabTrackList(
              repostedTracks,
              "Repost tracks and they will appear here.",
              "reposted-track",
            )}
          </div>
        </section>
      );
    }

    // Default "All" tab
    return (
      <>
        <section className="sc-profile-overview-strip">
          <div className="sc-profile-overview-copy">
            <h2>Spotlight</h2>
            <p>
              Highlight your best tracks and playlists so your audience finds
              them first.
            </p>
          </div>
          <div className="sc-overview-stats">
            <button
              className="sc-overview-stat"
              type="button"
              onClick={() => navigate("/followers")}
            >
              <span>Followers</span>
              <strong>{socialCounts.followersCount}</strong>
            </button>
            <button
              className="sc-overview-stat"
              type="button"
              onClick={() => navigate("/following")}
            >
              <span>Following</span>
              <strong>{socialCounts.followingCount}</strong>
            </button>
            <div className="sc-overview-stat">
              <span>Tracks</span>
              <strong>{profileTrackCount}</strong>
            </div>
          </div>
        </section>

        <section className="sc-profile-showcase-grid">
          <div className="sc-profile-showcase-main">
            <section className="sc-profile-section sc-profile-section--recent">
              <div className="sc-profile-section-head">
                <div>
                  <h2>Recent</h2>
                  <p>Latest played first.</p>
                </div>
                <Link to="/history" className="sc-profile-section-link">
                  View all
                </Link>
              </div>
              {renderRecentSection()}
            </section>

            <section className="sc-profile-section" id="profile-history">
              <div className="sc-profile-section-head">
                <div>
                  <h2>Listening history</h2>
                  <p>Everything listened to, newest to oldest.</p>
                </div>
                <Link to="/history" className="sc-profile-section-link">
                  Open history
                </Link>
              </div>
              <div className="sc-profile-history-list">
                {renderHistorySection()}
              </div>
            </section>

            <section className="sc-profile-section" id="profile-favorites">
              <div className="sc-profile-section-head">
                <div>
                  <h2>Favorites</h2>
                  <p>Tracks you liked.</p>
                </div>
              </div>
              <div className="sc-profile-track-list">
                {renderTrackRows(likedTracks, "Like a track to pin it here.", {
                  limit: 6,
                })}
              </div>
            </section>

            <section className="sc-profile-section" id="profile-reposts">
              <div className="sc-profile-section-head">
                <div>
                  <h2>Reposts</h2>
                  <p>Tracks pushed into your feed and profile.</p>
                </div>
              </div>
              <div className="sc-profile-track-list">
                {renderTrackRows(
                  repostedTracks,
                  "Repost a track and it will appear here.",
                  { limit: 6 },
                )}
              </div>
            </section>

            {showEmptyLibraryState ? (
              <div className="sc-empty-state">
                <p>Seems a little quiet over here</p>
                <button
                  className="sc-upload-now-btn"
                  type="button"
                  onClick={() => navigate("/upload")}
                >
                  Upload now
                </button>
              </div>
            ) : null}
          </div>

          <aside className="sc-profile-likes-rail">
            <div
              className="sc-profile-link-nav-strip"
              aria-label="Profile links and quick navigation"
            >
              {profile.bio ? (
                <p className="sc-profile-side-bio">{profile.bio}</p>
              ) : null}

              {/* Social links: try integrated's generic formatter first, fall back to main's SocialPlatforms icons */}
              {profileLinks.length ? (
                <div className="sc-sidebar-links" aria-label="Profile links">
                  {profileLinks.map((link) => (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="sc-social-link"
                      key={`${link.key}-${link.href}`}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : profile.socialLinks &&
                typeof profile.socialLinks === "object" ? (
                <div className="sc-sidebar-links" aria-label="Profile links">
                  {Object.entries(profile.socialLinks).map(([key, url]) => {
                    if (!url) return null;
                    const platform = detectPlatform(key);
                    return (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="sc-social-link"
                        key={key}
                      >
                        <PlatformIcon platform={platform} /> {key}
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="sc-profile-section-head sc-profile-section-head--rail">
              <div>
                <h2>{likeRailCount} Likes</h2>
              </div>
              <button
                className="sc-profile-section-link-button"
                type="button"
                onClick={() => handleJumpToSection("profile-favorites")}
              >
                View all
              </button>
            </div>
            <div className="sc-like-rail-list">{renderLikesRail()}</div>
          </aside>
        </section>

        {hasFooterMeta ? (
          <section className="sc-profile-footer-meta">
            {profile.bio ? (
              <div className="sc-profile-footer-block">
                <h3>About</h3>
                <p>{profile.bio}</p>
              </div>
            ) : null}
            {profile.favoriteGenres?.length > 0 ? (
              <div className="sc-profile-footer-block">
                <h3>Genres</h3>
                <div className="sc-sidebar-genres">
                  {profile.favoriteGenres.map((genre) => (
                    <span key={genre} className="sc-genre-tag">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </>
    );
  };

  // ── File upload handlers ────────────────────────────────────────────────────
  async function handleCoverChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    await onCoverUpload?.(file);
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    await onAvatarUpload?.(file);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="sc-profile-card">
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
            src={profile.avatarUrl || DEFAULT_TRACK_ART}
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
          {profile.location ? (
            <p className="sc-location">{profile.location}</p>
          ) : null}
        </div>
      </div>

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
                className={`sc-tab ${activeSurfaceTab === tab.label ? "sc-tab--active" : ""}`}
                type="button"
                onClick={() => {
                  if (isLibraryRoute && tab.libraryTab) {
                    navigate(
                      tab.libraryTab === "all"
                        ? "/library"
                        : `/library?tab=${tab.libraryTab}`,
                    );
                    return;
                  }
                  onTabChange?.(tab.label);
                }}
              >
                {tab.label}
              </button>
            ),
          )}
        </div>

        <div className="sc-actions">
          {/* From main: FollowButton and block menu for other profiles */}
          {!isOwnProfile ? (
            <>
              <button
                className="sc-action-btn"
                type="button"
                onClick={() => navigate("/feed")}
              >
                Station
              </button>
              <FollowButton userId={profile.id} />
              <button
                className="sc-action-btn sc-share-btn"
                type="button"
                onClick={handleShareProfile}
              >
                Share
              </button>
              <div className="sc-more-menu-wrap" ref={moreMenuRef}>
                <button
                  className="sc-action-btn sc-more-icon-btn"
                  type="button"
                  aria-label="More options"
                  onClick={() => setShowMoreMenu((v) => !v)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="5" cy="12" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="19" cy="12" r="1.5" />
                  </svg>
                </button>
                {showMoreMenu && (
                  <div className="sc-more-menu">
                    <button
                      type="button"
                      className="sc-more-menu__item"
                      onClick={() => {
                        setShowBlockModal(true);
                        setShowMoreMenu(false);
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                      {isBlocked ? "Unblock" : "Block"} {profile.displayName}
                    </button>
                    <button
                      type="button"
                      className="sc-more-menu__item"
                      onClick={() => setShowMoreMenu(false)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Report {profile.displayName}
                    </button>
                  </div>
                )}
              </div>
              {showBlockModal && (
                <BlockModal
                  userId={profile.id}
                  onConfirm={handleBlockConfirm}
                  onCancel={() => setShowBlockModal(false)}
                />
              )}
            </>
          ) : (
            <>
              <button
                className="sc-action-btn sc-action-btn-primary"
                type="button"
                onClick={() => navigate("/history")}
              >
                Your insights
              </button>
              <button
                className="sc-action-btn"
                type="button"
                onClick={() => navigate("/feed")}
              >
                Station
              </button>
              <button
                className="sc-action-btn sc-share-btn"
                type="button"
                onClick={handleShareProfile}
              >
                Share
              </button>
              <button
                className="sc-action-btn sc-edit-btn"
                type="button"
                onClick={onEditClick}
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      <div className="sc-content-area">
        <div className="sc-main-content">{renderActiveTabContent()}</div>
        <aside className="sc-sidebar">
          <div className="sc-stats">
            <div
              className="sc-stat sc-stat-link"
              onClick={() => navigate("/followers")}
              style={{ cursor: "pointer" }}
            >
              <span className="sc-stat-label">Followers</span>
              <span className="sc-stat-value">
                {socialCounts.followersCount}
              </span>
            </div>
            <div
              className="sc-stat sc-stat-link"
              onClick={() => navigate("/following")}
              style={{ cursor: "pointer" }}
            >
              <span className="sc-stat-label">Following</span>
              <span className="sc-stat-value">
                {socialCounts.followingCount}
              </span>
            </div>
            <div className="sc-stat">
              <span className="sc-stat-label">Tracks</span>
              <span className="sc-stat-value">{profileTrackCount}</span>
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
            {(() => {
              const sl = profile.socialLinks ?? {};
              const PLATFORMS = [
                "instagram",
                "twitter",
                "youtube",
                "facebook",
                "tiktok",
                "website",
                "patreon",
                "kofi",
              ];
              const topLevel = PLATFORMS.filter((p) => sl[p]).map((p) => ({
                platform: p,
                url: sl[p],
              }));
              const seen = new Set(topLevel.map((l) => l.url));
              const extra = (sl.links ?? []).filter(
                (l) => l.url && !seen.has(l.url),
              );
              return [...topLevel, ...extra];
            })().map((link, i) => (
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

          <div className="sc-upgrade-card">
            <div className="sc-upgrade-card-header">
              <span className="sc-upgrade-card-label">ARTIST PRO</span>
            </div>
            <p className="sc-upgrade-card-desc">
              With an Artist Pro account, you can upload more tracks, access
              advanced analytics, and promote your music.
            </p>
            <Link to="/premium" className="sc-upgrade-card-btn">
              Upgrade to Artist Pro
            </Link>
          </div>
        </aside>
      </div>

      {/* Delete confirmation modal */}
      {deleteCandidate ? (
        <div
          className="sc-track-delete-overlay"
          role="presentation"
          onClick={() => setDeleteCandidate(null)}
        >
          <div
            className="sc-track-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Delete ${deleteCandidate.title}`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="sc-track-delete-close"
              type="button"
              onClick={() => setDeleteCandidate(null)}
              aria-label="Close delete dialog"
            >
              ×
            </button>
            <div className="sc-track-delete-preview">
              <button
                className="sc-track-delete-cover"
                type="button"
                onClick={() => handleOpenTrack(deleteCandidate)}
              >
                <img
                  src={deleteCandidate.cover || DEFAULT_TRACK_ART}
                  alt={deleteCandidate.title}
                />
              </button>
              <div className="sc-track-delete-hero">
                <div className="sc-track-delete-track-meta">
                  <button
                    className="sc-track-delete-play"
                    type="button"
                    onClick={() => handleTrackPlayback(deleteCandidate)}
                  >
                    <PlayGlyph
                      isPlaying={
                        currentTrackId === deleteCandidate.id && isPlaying
                      }
                    />
                  </button>
                  <div className="sc-track-delete-copy">
                    <span>{deleteCandidate.artist}</span>
                    <strong>{deleteCandidate.title}</strong>
                  </div>
                  <span className="sc-track-delete-age">
                    {formatRelativePlayedAt(
                      deleteCandidate.played_at ??
                        deleteCandidate.playedAt ??
                        deleteCandidate.postedAt,
                    )}
                  </span>
                </div>
                <RecentWaveform
                  track={deleteCandidate}
                  isActive={currentTrackId === deleteCandidate.id}
                  currentTime={currentTime}
                  onSeek={(seconds) =>
                    handleTrackSeek(deleteCandidate, seconds)
                  }
                />
              </div>
            </div>
            <div className="sc-track-delete-body">
              <h3>Delete this track?</h3>
              <p>
                Deleting removes the track from this profile, including plays,
                likes, reposts, and comments.
              </p>
              <div className="sc-track-delete-grid">
                <div>
                  <strong>Replace your file</strong>
                  <p>
                    Keep your stats, plays, likes, and comments with the same
                    track shell.
                  </p>
                </div>
                <div>
                  <strong>Delete forever</strong>
                  <p>
                    Remove this track from the backend and all profile surfaces.
                  </p>
                </div>
              </div>
            </div>
            <div className="sc-track-delete-footer">
              <button
                className="sc-track-delete-replace"
                type="button"
                onClick={() =>
                  setPlayerMessage?.(
                    "Replace file will land here when that flow is wired.",
                  )
                }
              >
                Replace File
              </button>
              <div className="sc-track-delete-actions">
                <button
                  className="sc-track-delete-cancel"
                  type="button"
                  onClick={() => setDeleteCandidate(null)}
                >
                  Cancel
                </button>
                <button
                  className="sc-track-delete-confirm"
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={Boolean(pendingDeleteTrackIds[deleteCandidate.id])}
                >
                  {pendingDeleteTrackIds[deleteCandidate.id]
                    ? "Deleting..."
                    : "Delete forever"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {!isOwnProfile && (
        <BlockModal
          isOpen={showBlockModal}
          onClose={() => setShowBlockModal(false)}
          onConfirm={handleBlockConfirm}
          user={{ id: profile.id, displayName: profile.displayName }}
          mode="block"
        />
      )}
    </div>
  );
}
