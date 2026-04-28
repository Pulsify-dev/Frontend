import { trackExperienceMockData } from "../mock/trackExperienceData";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000/api";
const useMock = String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === "true";
const allowMockFallback =
  String(import.meta.env.VITE_USE_MOCK_API).toLowerCase() !== "false";

const clone = (value) => JSON.parse(JSON.stringify(value));

const formatIsoNow = () => new Date().toISOString();

const readStoredJson = (key) => {
  if (typeof window === "undefined") return null;

  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

const writeStoredJson = (key, value) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures so the app can continue without persistence.
  }
};

const readSessionJson = (key) => {
  if (typeof window === "undefined") return null;

  const rawValue = window.sessionStorage.getItem(key);
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
};

const saveSessionJson = (key, value) => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write failures so API calls still work normally.
  }
};

const normalizePlaybackState = (value) => {
  const normalizedValue = String(value ?? "").toLowerCase();

  if (normalizedValue === "blocked") return "Blocked";
  if (normalizedValue === "preview") return "Preview";
  return "Playable";
};

const AUTH_TOKEN_STORAGE_KEYS = [
  "pulsify_access_token",
  "pulsify_token",
  "accessToken",
  "pulsify_jwt_token",
];

const readStoredAuthToken = () => {
  if (typeof window === "undefined") return "";

  for (const key of AUTH_TOKEN_STORAGE_KEYS) {
    const token = window.localStorage.getItem(key)?.trim();
    if (token) return token;
  }

  return "";
};

const decodeBase64Url = (value = "") => {
  if (typeof window === "undefined" || !value) return "";

  try {
    const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
    const paddedValue =
      normalizedValue + "=".repeat((4 - (normalizedValue.length % 4)) % 4);
    const decodedValue = window.atob(paddedValue);

    return decodeURIComponent(
      decodedValue
        .split("")
        .map(
          (character) =>
            `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`,
        )
        .join(""),
    );
  } catch {
    return "";
  }
};

const decodeJwtPayload = (token) => {
  const parts = String(token ?? "").split(".");
  if (parts.length < 2) return {};

  try {
    const decodedPayload = decodeBase64Url(parts[1]);
    return decodedPayload ? JSON.parse(decodedPayload) : {};
  } catch {
    return {};
  }
};

export const getStoredViewerIdentity = () => {
  if (typeof window === "undefined") {
    return {
      userId: "",
      username: "",
      displayName: "",
      avatar: "",
    };
  }

  const storedUser =
    readStoredJson("pulsify_user") ??
    readStoredJson("user") ??
    readStoredJson("currentUser") ??
    readStoredJson("profile") ??
    {};
  const tokenPayload = decodeJwtPayload(readStoredAuthToken());

  return {
    userId:
      window.localStorage.getItem("userId") ??
      window.localStorage.getItem("user_id") ??
      storedUser.id ??
      storedUser.user_id ??
      storedUser.userId ??
      storedUser._id ??
      tokenPayload.user_id ??
      tokenPayload.userId ??
      tokenPayload.sub ??
      "",
    username:
      window.localStorage.getItem("username") ??
      storedUser.username ??
      tokenPayload.username ??
      "",
    displayName:
      window.localStorage.getItem("display_name") ??
      window.localStorage.getItem("displayName") ??
      storedUser.display_name ??
      storedUser.displayName ??
      tokenPayload.display_name ??
      tokenPayload.displayName ??
      tokenPayload.username ??
      "",
    avatar:
      window.localStorage.getItem("avatar") ??
      window.localStorage.getItem("avatar_url") ??
      storedUser.avatar ??
      storedUser.avatarUrl ??
      storedUser.avatar_url ??
      storedUser.profile_picture ??
      storedUser.profile_image ??
      tokenPayload.avatar ??
      tokenPayload.avatar_url ??
      "",
  };
};

const getAuthToken = () => {
  if (typeof window === "undefined")
    return import.meta.env.VITE_AUTH_TOKEN ?? "";

  return readStoredAuthToken() || import.meta.env.VITE_AUTH_TOKEN || "";
};

export const hasAuthToken = () => Boolean(getAuthToken());

export const readAuthToken = () => getAuthToken();

export const saveAuthToken = (token) => {
  if (typeof window === "undefined") return;

  const normalizedToken = String(token ?? "").trim();
  if (!normalizedToken) return;

  AUTH_TOKEN_STORAGE_KEYS.forEach((key) => {
    window.localStorage.setItem(key, normalizedToken);
  });
};

export const clearAuthToken = () => {
  if (typeof window === "undefined") return;

  AUTH_TOKEN_STORAGE_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
  });
};

const shouldUseMockFallback = (error) => {
  if (useMock || !allowMockFallback) return false;

  return error?.status === 401 || error?.name === "TypeError";
};

const withMockFallback = async (requester, fallback) => {
  if (!useMock && allowMockFallback && !hasAuthToken()) {
    return fallback();
  }

  try {
    return await requester();
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      console.warn("Falling back to mock track data.", error);
      return fallback();
    }

    throw error;
  }
};

const coerceNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const coerceBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value !== "string") return null;

  const normalizedValue = value.trim().toLowerCase();
  if (!normalizedValue) return null;
  if (["true", "1", "yes"].includes(normalizedValue)) return true;
  if (["false", "0", "no"].includes(normalizedValue)) return false;
  return null;
};

const normalizeDateValue = (value) => {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  const parsedNumber = coerceNumber(value);
  if (parsedNumber !== null && typeof value !== "string") {
    const parsedDate = new Date(parsedNumber);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
};

const parseTimecodeToSeconds = (value) => {
  if (typeof value !== "string" || !value.includes(":")) return null;

  const parts = value
    .trim()
    .split(":")
    .map((part) => Number(part));

  if (
    parts.length < 2 ||
    parts.length > 3 ||
    parts.some((part) => !Number.isFinite(part) || part < 0)
  ) {
    return null;
  }

  return parts.reduce((total, part) => total * 60 + part, 0);
};

const resolveCommentTimestampMs = (comment = {}) => {
  const milliseconds = [
    comment.timestamp_ms,
    comment.timestampMs,
    comment.time_ms,
    comment.timeMs,
    comment.position_ms,
    comment.positionMs,
    comment.playback_timestamp_ms,
    comment.playbackTimestampMs,
    comment.track_timestamp_ms,
    comment.trackTimestampMs,
  ]
    .map(coerceNumber)
    .find((value) => value !== null);

  if (milliseconds !== undefined) {
    return milliseconds === null ? null : Math.round(milliseconds);
  }

  const seconds = [
    comment.timestamp_seconds,
    comment.timestampSeconds,
    comment.time_seconds,
    comment.timeSeconds,
    comment.position_seconds,
    comment.positionSeconds,
    comment.playback_timestamp_seconds,
    comment.playbackTimestampSeconds,
    comment.track_timestamp_seconds,
    comment.trackTimestampSeconds,
  ]
    .map(coerceNumber)
    .find((value) => value !== null);

  if (seconds !== undefined) {
    return seconds === null ? null : Math.round(seconds * 1000);
  }

  for (const candidate of [
    comment.timestamp,
    comment.time,
    comment.position,
    comment.playback_timestamp,
    comment.playbackTimestamp,
    comment.track_timestamp,
    comment.trackTimestamp,
    comment.timecode,
    comment.timestamp_label,
    comment.timestampLabel,
  ]) {
    const parsedNumber = coerceNumber(candidate);
    if (parsedNumber !== null) {
      return parsedNumber > 1000
        ? Math.round(parsedNumber)
        : Math.round(parsedNumber * 1000);
    }

    const parsedSeconds = parseTimecodeToSeconds(candidate);
    if (parsedSeconds !== null) {
      return Math.round(parsedSeconds * 1000);
    }
  }

  return null;
};

const hasMeaningfulUserData = (user) =>
  Boolean(
    user &&
    typeof user === "object" &&
    [
      user.id,
      user._id,
      user.user_id,
      user.userId,
      user.author_id,
      user.authorId,
      user.name,
      user.display_name,
      user.displayName,
      user.full_name,
      user.fullName,
      user.username,
      user.avatar,
      user.avatarUrl,
      user.avatar_url,
      user.profile_picture,
      user.profile_image,
    ].some((value) => value != null && String(value).trim() !== ""),
  );

const getViewerFallbackUser = (viewer = {}) => ({
  id: viewer.userId,
  name: viewer.displayName || viewer.username || "You",
  username: viewer.username || undefined,
  avatar: viewer.avatar || null,
});

const normalizeIdentityToken = (value) =>
  String(value ?? "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

const normalizeUser = (user = {}) => ({
  id:
    user.id ??
    user._id ??
    user.user_id ??
    user.userId ??
    user.author_id ??
    user.authorId ??
    `user-${Math.random().toString(16).slice(2, 10)}`,
  name:
    user.name ??
    user.display_name ??
    user.displayName ??
    user.full_name ??
    user.fullName ??
    user.username ??
    "Unknown listener",
  handle:
    user.handle ??
    (user.username ? `@${user.username}` : null) ??
    (user.display_name ? `@${user.display_name}` : null) ??
    (user.displayName ? `@${user.displayName}` : "@listener"),
  avatar:
    user.avatar ??
    user.avatarUrl ??
    user.avatar_url ??
    user.profile_picture ??
    user.profile_image ??
    user.image ??
    user.image_url ??
    user.photoUrl ??
    user.photo_url ??
    null,
});

const normalizeComment = (
  comment = {},
  { assumeViewerOwnership = false } = {},
) => {
  const viewer = getStoredViewerIdentity();
  const viewerUserId = String(viewer.userId ?? "").trim();
  const viewerIdentityCandidates = [
    viewer.userId,
    viewer.username,
    viewer.displayName,
  ]
    .map(normalizeIdentityToken)
    .filter(Boolean);
  const commentUserSource =
    comment.user ??
    comment.author ??
    comment.creator ??
    comment.owner ??
    comment.commenter ??
    comment.listener ??
    comment.account ??
    comment.profile ??
    null;
  const rawOwnership =
    coerceBoolean(
      comment.is_owned_by_viewer ??
        comment.isOwnedByViewer ??
        comment.is_owner ??
        comment.isOwner ??
        comment.owned_by_current_user ??
        comment.ownedByCurrentUser ??
        comment.is_mine ??
        comment.isMine ??
        comment.mine,
    ) ?? (assumeViewerOwnership ? true : null);
  const fallbackCommentUser =
    hasMeaningfulUserData(commentUserSource) ||
    hasMeaningfulUserData({
      id:
        comment.user_id ??
        comment.userId ??
        comment.author_id ??
        comment.authorId ??
        comment.user?.id ??
        comment.user?._id,
      name:
        comment.display_name ??
        comment.displayName ??
        comment.name ??
        comment.full_name ??
        comment.fullName ??
        comment.username ??
        comment.user_name,
      username: comment.username ?? comment.user_name,
      avatar:
        comment.avatar ??
        comment.avatarUrl ??
        comment.avatar_url ??
        comment.profile_picture ??
        comment.profile_image,
    })
      ? {
          id:
            comment.user_id ??
            comment.userId ??
            comment.author_id ??
            comment.authorId ??
            comment.user?.id ??
            comment.user?._id,
          name:
            comment.display_name ??
            comment.displayName ??
            comment.name ??
            comment.full_name ??
            comment.fullName ??
            comment.username ??
            comment.user_name,
          username: comment.username ?? comment.user_name,
          avatar:
            comment.avatar ??
            comment.avatarUrl ??
            comment.avatar_url ??
            comment.profile_picture ??
            comment.profile_image,
        }
      : rawOwnership
        ? getViewerFallbackUser(viewer)
        : null;
  const user = normalizeUser(
    commentUserSource ?? fallbackCommentUser ?? undefined,
  );
  const commentUserId = String(
    comment.user_id ??
      comment.userId ??
      comment.author_id ??
      comment.authorId ??
      comment.user?.id ??
      comment.author?.id ??
      comment.author?._id ??
      comment.user?._id ??
      user.id ??
      "",
  ).trim();
  const commentIdentityCandidates = [
    comment.user_id,
    comment.userId,
    comment.author_id,
    comment.authorId,
    comment.user?.id,
    comment.user?._id,
    comment.user?.user_id,
    comment.user?.userId,
    comment.author?.id,
    comment.author?._id,
    comment.author?.user_id,
    comment.author?.userId,
    comment.username,
    comment.user_name,
    comment.display_name,
    comment.displayName,
    comment.name,
    commentUserSource?.username,
    commentUserSource?.user_name,
    commentUserSource?.display_name,
    commentUserSource?.displayName,
    commentUserSource?.name,
    user.id,
    user.handle,
    user.name,
  ]
    .map(normalizeIdentityToken)
    .filter(Boolean);
  const parentCommentId =
    comment.parent_comment_id ??
    comment.parentCommentId ??
    comment.parent_id ??
    comment.parentId ??
    comment.parent?.id ??
    comment.parent?._id ??
    comment.parent_comment?.id ??
    comment.parent_comment?._id ??
    null;
  const resolvedTimestampMs = resolveCommentTimestampMs(comment);
  const timestampMs =
    parentCommentId && (resolvedTimestampMs == null || resolvedTimestampMs <= 0)
      ? null
      : resolvedTimestampMs;
  const createdAt =
    normalizeDateValue(
      comment.created_at ??
        comment.createdAt ??
        comment.inserted_at ??
        comment.insertedAt ??
        comment.posted_at ??
        comment.postedAt ??
        comment.date_created ??
        comment.dateCreated ??
        comment.date ??
        (typeof comment.timestamp === "string" ? comment.timestamp : null),
    ) ?? formatIsoNow();
  const updatedAt = normalizeDateValue(
    comment.updated_at ??
      comment.updatedAt ??
      comment.edited_at ??
      comment.editedAt,
  );
  const isDeleted = Boolean(
    coerceBoolean(
      comment.is_deleted ??
        comment.isDeleted ??
        comment.deleted ??
        comment.is_removed ??
        comment.isRemoved,
    ) ?? comment.deleted_at,
  );
  const identityMatch =
    viewerIdentityCandidates.length > 0 &&
    commentIdentityCandidates.some((value) =>
      viewerIdentityCandidates.includes(value),
    );
  const exactViewerIdMatch = Boolean(
    viewerUserId && commentUserId && commentUserId === viewerUserId,
  );
  const resolvedOwnership =
    rawOwnership === true || exactViewerIdMatch || identityMatch;
  const isOwnedByViewer = Boolean(resolvedOwnership);
  const rawCanEdit = coerceBoolean(
    comment.can_edit ??
      comment.canEdit ??
      comment.editable ??
      comment.is_editable ??
      comment.isEditable ??
      comment.permissions?.can_edit ??
      comment.permissions?.canEdit ??
      comment.permissions?.edit ??
      comment.actions?.can_edit ??
      comment.actions?.canEdit,
  );
  const rawCanDelete = coerceBoolean(
    comment.can_delete ??
      comment.canDelete ??
      comment.deletable ??
      comment.is_deletable ??
      comment.isDeletable ??
      comment.permissions?.can_delete ??
      comment.permissions?.canDelete ??
      comment.permissions?.delete ??
      comment.actions?.can_delete ??
      comment.actions?.canDelete,
  );
  const canDelete = Boolean(
    (rawCanDelete === true || isOwnedByViewer) && !isDeleted,
  );
  const canEdit = Boolean(
    (rawCanEdit === true || rawCanDelete === true || isOwnedByViewer) &&
    !isDeleted,
  );

  return {
    id:
      comment.comment_id ??
      comment.commentId ??
      comment.reply_id ??
      comment.replyId ??
      comment.id ??
      comment._id ??
      `comment-${Math.random().toString(16).slice(2, 10)}`,
    text: comment.text ?? comment.content ?? comment.body ?? "",
    timestamp_ms: timestampMs,
    created_at: createdAt,
    user,
    parentCommentId,
    repliesCount: Math.max(
      0,
      coerceNumber(
        comment.replies_count ??
          comment.repliesCount ??
          comment.reply_count ??
          comment.replyCount,
      ) ?? (Array.isArray(comment.replies) ? comment.replies.length : 0),
    ),
    likesCount: Math.max(
      0,
      coerceNumber(
        comment.likes_count ??
          comment.likesCount ??
          comment.like_count ??
          comment.likeCount,
      ) ?? 0,
    ),
    isEdited:
      coerceBoolean(
        comment.is_edited ??
          comment.isEdited ??
          comment.edited ??
          comment.was_edited ??
          comment.wasEdited,
      ) ?? Boolean(updatedAt && createdAt && updatedAt !== createdAt),
    isDeleted,
    isOwnedByViewer,
    canEdit,
    canDelete,
  };
};

const createWaveform = (seed) =>
  Array.from({ length: 140 }, (_, index) => {
    const primary = (Math.sin((index + seed) * 0.43) + 1) / 2;
    const secondary = (Math.cos((index + seed) * 0.19) + 1) / 2;
    return Number((0.16 + primary * 0.5 + secondary * 0.14).toFixed(3));
  });

const normalizeTrack = (track = {}) => {
  const id =
    track._id ?? track.id ?? track.track_id ?? track.trackId ?? "trk-2026-014";

  const artist =
    track.artist ??
    track.uploader?.username ??
    track.uploader?.display_name ??
    track.user?.username ??
    track.user?.display_name ??
    "Unknown artist";

  const cover =
    track.cover ??
    track.cover_url ??
    track.artwork_url ??
    track.thumbnail_url ??
    "";

  const audioUrl =
    track.audioUrl ??
    track.audio_url ??
    track.stream_url ??
    track.file_url ??
    "";

  const duration =
    track.duration ?? track.duration_seconds ?? track.length ?? 0;

  return {
    id,
    title: track.title ?? "Untitled track",
    artist,
    artistHandle:
      track.artistHandle ??
      (track.uploader?.username ? `@${track.uploader.username}` : null) ??
      (track.user?.username ? `@${track.user.username}` : null) ??
      "@artist",
    artistAvatar:
      track.artistAvatar ??
      track.uploader?.avatar_url ??
      track.user?.avatar_url ??
      cover,
    cover,
    audioUrl,
    duration,
    description: track.description ?? "",
    genre: track.genre ?? "Electronic",
    location: track.location ?? "Cairo, Egypt",
    postedAt:
      track.postedAt ??
      track.created_at ??
      track.uploaded_at ??
      track.release_date ??
      formatIsoNow(),
    playCount: track.playCount ?? track.plays ?? track.play_count ?? 0,
    likeCount:
      track.likeCount ??
      track.likes ??
      track.likes_count ??
      track.like_count ??
      0,
    repostCount:
      track.repostCount ??
      track.reposts ??
      track.reposts_count ??
      track.repost_count ??
      0,
    commentCount:
      track.commentCount ??
      track.comment_count ??
      track.comments_count ??
      track.commentsCount ??
      (Array.isArray(track.comments) ? track.comments.length : 0),
    viewerHasLiked:
      Boolean(track.viewerHasLiked) ||
      Boolean(track.viewer_has_liked) ||
      Boolean(track.is_liked) ||
      Boolean(track.liked),
    viewerHasReposted:
      Boolean(track.viewerHasReposted) ||
      Boolean(track.viewer_has_reposted) ||
      Boolean(track.is_reposted) ||
      Boolean(track.reposted),
    playbackState:
      track.playbackState ??
      normalizePlaybackState(track.playback_state) ??
      "Playable",
    previewDurationSeconds:
      track.previewDurationSeconds ?? track.preview_duration_seconds ?? 0,
    waveform:
      Array.isArray(track.waveform) && track.waveform.length
        ? track.waveform
        : createWaveform(id.length),
    typeLabel: track.typeLabel ?? track.type ?? track.track_type ?? "Music",
  };
};

const normalizeTrackCard = (track = {}) => {
  const normalizedTrack = normalizeTrack(track);

  return {
    id: normalizedTrack.id,
    title: normalizedTrack.title,
    artist: normalizedTrack.artist,
    artistHandle: normalizedTrack.artistHandle,
    cover: normalizedTrack.cover,
    duration: normalizedTrack.duration,
    playCount: normalizedTrack.playCount,
    likeCount: normalizedTrack.likeCount,
    repostCount: normalizedTrack.repostCount,
    commentCount: normalizedTrack.commentCount,
    postedAt: normalizedTrack.postedAt,
    typeLabel: normalizedTrack.typeLabel,
    audioUrl: normalizedTrack.audioUrl,
    playbackState: normalizedTrack.playbackState,
    previewDurationSeconds: normalizedTrack.previewDurationSeconds,
    waveform: normalizedTrack.waveform,
    viewerHasLiked: normalizedTrack.viewerHasLiked,
    viewerHasReposted: normalizedTrack.viewerHasReposted,
  };
};

const VIEWER_TRACK_ENGAGEMENT_STORAGE_KEY =
  "pulsify_viewer_track_engagement_v1";

const getViewerTrackEngagementViewerKey = () => {
  const viewer = getStoredViewerIdentity();
  const rawKey =
    viewer.userId || viewer.username || viewer.displayName || "anonymous";

  return String(rawKey).trim().toLowerCase() || "anonymous";
};

const createEmptyViewerTrackEngagementCollections = () => ({
  liked: {},
  reposted: {},
});

const readViewerTrackEngagementStore = () => {
  const store = readStoredJson(VIEWER_TRACK_ENGAGEMENT_STORAGE_KEY);
  return store && typeof store === "object" ? store : {};
};

const writeViewerTrackEngagementStore = (store) => {
  writeStoredJson(VIEWER_TRACK_ENGAGEMENT_STORAGE_KEY, store);
};

const getViewerTrackEngagementCollections = () => {
  const store = readViewerTrackEngagementStore();
  const viewerKey = getViewerTrackEngagementViewerKey();
  const viewerCollections = store?.[viewerKey];

  if (!viewerCollections || typeof viewerCollections !== "object") {
    return createEmptyViewerTrackEngagementCollections();
  }

  return {
    liked:
      viewerCollections.liked && typeof viewerCollections.liked === "object"
        ? viewerCollections.liked
        : {},
    reposted:
      viewerCollections.reposted &&
      typeof viewerCollections.reposted === "object"
        ? viewerCollections.reposted
        : {},
  };
};

const writeViewerTrackEngagementCollections = (collections) => {
  const store = readViewerTrackEngagementStore();
  const viewerKey = getViewerTrackEngagementViewerKey();

  store[viewerKey] = collections;
  writeViewerTrackEngagementStore(store);
};

const normalizeViewerTrackCacheSnapshot = (track = {}) => {
  const trackId = String(track.trackId ?? track.id ?? "").trim();
  if (!trackId) return null;

  const normalizedTrack = normalizeTrackCard({
    ...track,
    id: trackId,
    trackId,
  });

  return {
    ...normalizedTrack,
    id: trackId,
    trackId,
  };
};

const updateViewerTrackEngagementCache = (track = {}) => {
  if (typeof window === "undefined") return;

  const trackId = String(track.trackId ?? track.id ?? "").trim();
  if (!trackId) return;

  const currentCollections = getViewerTrackEngagementCollections();
  const existingSnapshot = currentCollections.liked?.[trackId] ??
    currentCollections.reposted?.[trackId] ?? { id: trackId, trackId };
  const nextSnapshot = normalizeViewerTrackCacheSnapshot({
    ...existingSnapshot,
    ...track,
    id: trackId,
    trackId,
  });

  if (!nextSnapshot) return;

  const cachedAt = formatIsoNow();
  const nextCollections = {
    liked: { ...currentCollections.liked },
    reposted: { ...currentCollections.reposted },
  };

  if (nextSnapshot.viewerHasLiked) {
    nextCollections.liked[trackId] = {
      ...nextSnapshot,
      cachedAt,
    };
  } else {
    delete nextCollections.liked[trackId];
  }

  if (nextSnapshot.viewerHasReposted) {
    nextCollections.reposted[trackId] = {
      ...nextSnapshot,
      cachedAt,
    };
  } else {
    delete nextCollections.reposted[trackId];
  }

  writeViewerTrackEngagementCollections(nextCollections);
};

const readViewerTrackEngagementCollection = (collectionType) => {
  const collections = getViewerTrackEngagementCollections();

  return Object.values(collections?.[collectionType] ?? {})
    .sort((left, right) => {
      const leftTime = new Date(left.cachedAt ?? 0).getTime();
      const rightTime = new Date(right.cachedAt ?? 0).getTime();
      return rightTime - leftTime;
    })
    .map(({ cachedAt, ...track }) => clone(track));
};

const normalizePlaylist = (playlist = {}) => ({
  id:
    playlist.id ??
    playlist.playlistId ??
    `playlist-${Math.random().toString(16).slice(2, 8)}`,
  title: playlist.title ?? playlist.playlistName ?? "Untitled playlist",
  creatorName: playlist.creatorName ?? playlist.creatorId ?? "Unknown curator",
  creatorHandle: playlist.creatorHandle ?? "@playlist",
  cover: playlist.cover ?? playlist.thumbnailUrl ?? "",
  likes: playlist.likes ?? playlist.likeCount ?? 0,
  trackCount: playlist.trackCount ?? 0,
});

const normalizeFanEntry = (entry = {}) => ({
  ...normalizeUser(entry),
  plays: entry.plays ?? entry.playCount ?? 0,
});

const unwrapEntity = (payload, preferredKeys = []) => {
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return payload;
  }

  for (const key of preferredKeys) {
    const candidate = payload?.[key];
    if (candidate != null) {
      return unwrapEntity(candidate, preferredKeys);
    }
  }

  for (const key of ["data", "result", "item"]) {
    const candidate = payload?.[key];
    if (
      candidate &&
      !Array.isArray(candidate) &&
      typeof candidate === "object"
    ) {
      return unwrapEntity(candidate, preferredKeys);
    }
  }

  return payload;
};

const findCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return null;

  for (const key of [
    "items",
    "data",
    "results",
    "comments",
    "tracks",
    "likes",
    "reposts",
    "favorites",
    "favourites",
    "likedTracks",
    "liked_tracks",
    "favoriteTracks",
    "favorite_tracks",
    "repostedTracks",
    "reposted_tracks",
    "users",
    "history",
    "recentlyPlayed",
    "recently_played",
    "playlists",
    "fans",
    "likers",
    "reposters",
    "replies",
  ]) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  for (const key of ["data", "result", "item"]) {
    const nestedCollection = findCollection(payload?.[key]);
    if (nestedCollection) {
      return nestedCollection;
    }
  }

  return null;
};

const unwrapCollection = (payload) => {
  const collection = findCollection(payload);
  if (collection) return collection;
  return [];
};

const resolvePagination = (payload, fallbackPage = 1, fallbackLimit = 20) => {
  const pagination = payload?.pagination;
  const page = Number(pagination?.page ?? payload?.page ?? fallbackPage);
  const limit = Number(pagination?.limit ?? payload?.limit ?? fallbackLimit);
  const total = Number(
    pagination?.total ??
      payload?.total ??
      payload?.count ??
      payload?.comments_count ??
      payload?.replies_count ??
      0,
  );
  const pages = Number(
    pagination?.pages ??
      payload?.pages ??
      (limit > 0 ? Math.ceil(total / limit) : 1),
  );

  return {
    page: Number.isFinite(page) && page > 0 ? page : fallbackPage,
    limit: Number.isFinite(limit) && limit > 0 ? limit : fallbackLimit,
    total: Number.isFinite(total) && total >= 0 ? total : 0,
    pages: Number.isFinite(pages) && pages >= 0 ? pages : 0,
  };
};

const request = async (path, { method = "GET", body, auth = true } = {}) => {
  const headers = {
    Accept: "application/json",
  };

  const token = getAuthToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isFormData = body instanceof FormData;
  if (body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401 && auth && token) {
      clearAuthToken();
    }

    let errorMessage = `Request failed: ${response.status}`;
    let errorPayload = null;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        errorPayload = await response.json();
      } catch {
        errorPayload = null;
      }
    } else {
      try {
        const rawText = await response.text();
        errorPayload = rawText ? { message: rawText } : null;
      } catch {
        errorPayload = null;
      }
    }

    errorMessage =
      errorPayload?.message ??
      errorPayload?.error ??
      errorPayload?.details?.message ??
      errorPayload?.details?.[0]?.message ??
      errorMessage;

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = errorPayload;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
};

const buildCommentMutationBody = (payload = {}) => {
  const normalizedText = String(
    payload.text ?? payload.content ?? payload.body ?? "",
  ).trim();
  const normalizedTimestampMs = coerceNumber(payload.timestamp_ms);

  return {
    text: normalizedText,
    content: normalizedText,
    ...(normalizedTimestampMs !== null
      ? {
          timestamp_seconds: Math.max(
            Math.round(normalizedTimestampMs / 1000),
            0,
          ),
        }
      : {}),
    ...((payload.parent_comment_id ?? payload.parentCommentId) != null
      ? {
          parent_comment_id:
            payload.parent_comment_id ?? payload.parentCommentId,
        }
      : {}),
  };
};

const requestWithOptionalAuth = async (path, options = {}) => {
  try {
    return await request(path, { ...options, auth: true });
  } catch (error) {
    if (error?.status === 401) {
      return request(path, { ...options, auth: false });
    }

    throw error;
  }
};

const createTrackSummary = (track, overrides = {}) => ({
  id: track.id,
  title: track.title,
  artist: track.artist,
  cover: track.cover,
  duration: track.duration,
  played_at: overrides.played_at ?? formatIsoNow(),
  duration_played_ms: overrides.duration_played_ms ?? track.duration * 1000,
});

const getHistoryTrackSource = (entry = {}) =>
  entry.track ??
  entry.song ??
  entry.item ??
  entry.audio ??
  entry.track_data ??
  entry.trackData ??
  entry;

const getHistoryTrackId = (
  entry = {},
  trackSource = getHistoryTrackSource(entry),
) =>
  trackSource?.id ??
  trackSource?._id ??
  trackSource?.track_id ??
  trackSource?.trackId ??
  entry.track_id ??
  entry.trackId ??
  entry.track?.id ??
  entry.track?._id ??
  entry.song?.id ??
  entry.song?._id ??
  entry.item?.id ??
  entry.item?._id ??
  entry.audio?.id ??
  entry.audio?._id ??
  entry.track_data?.id ??
  entry.track_data?._id ??
  entry.trackData?.id ??
  entry.trackData?._id ??
  "";

const normalizeHistoryEntry = (entry = {}) => {
  const trackSource = getHistoryTrackSource(entry);
  const normalizedTrack = normalizeTrack(trackSource);
  const resolvedTrackId =
    getHistoryTrackId(entry, trackSource) ||
    (trackSource && trackSource !== entry ? normalizedTrack.id : "");
  const historyEntryId =
    entry.history_id ??
    entry.historyId ??
    entry._id ??
    entry.id ??
    `history-${Math.random().toString(16).slice(2, 10)}`;

  const durationPlayedMs =
    entry.duration_played_ms ??
    entry.durationPlayedMs ??
    entry.played_duration_ms ??
    entry.playedDurationMs ??
    entry.progress_ms ??
    (entry.duration_played_seconds != null
      ? Math.round(Number(entry.duration_played_seconds) * 1000)
      : Math.max((normalizedTrack.duration ?? 0) * 1000, 0));

  const playedAt =
    entry.played_at ??
    entry.playedAt ??
    entry.last_played_at ??
    entry.lastPlayedAt ??
    entry.created_at ??
    entry.updated_at ??
    formatIsoNow();

  return {
    id: resolvedTrackId || historyEntryId,
    trackId: resolvedTrackId || historyEntryId,
    historyEntryId,
    title: normalizedTrack.title,
    artist: normalizedTrack.artist,
    cover: normalizedTrack.cover,
    duration: normalizedTrack.duration,
    played_at: playedAt,
    playedAt,
    duration_played_ms: durationPlayedMs,
    durationPlayedMs: durationPlayedMs,
  };
};

const sortHistoryEntriesDescending = (items = []) =>
  [...items].sort((left, right) => {
    const leftTimestamp = new Date(
      left.played_at ?? left.playedAt ?? 0,
    ).getTime();
    const rightTimestamp = new Date(
      right.played_at ?? right.playedAt ?? 0,
    ).getTime();

    return rightTimestamp - leftTimestamp;
  });

const dedupeHistoryEntriesByTrack = (items = []) => {
  const itemMap = new Map();

  sortHistoryEntriesDescending(items).forEach((item) => {
    if (!item?.id || itemMap.has(item.id)) return;
    itemMap.set(item.id, item);
  });

  return [...itemMap.values()];
};

const normalizeHistoryCollection = (payload) =>
  sortHistoryEntriesDescending(
    unwrapCollection(payload).map(normalizeHistoryEntry),
  );

const buildSeedUsers = () => {
  const userMap = new Map();

  const writeUser = (user) => {
    const normalized = normalizeUser(user);
    userMap.set(normalized.id, normalized);
  };

  writeUser(trackExperienceMockData.viewer);

  Object.values(trackExperienceMockData.engagement).forEach((entry) => {
    (entry.comments ?? []).forEach((comment) => writeUser(comment.user));
    (entry.likers ?? []).forEach(writeUser);
    (entry.reposters ?? []).forEach(writeUser);
    (entry.fans ?? []).forEach(writeUser);
  });

  return [...userMap.values()];
};

const seedUsers = buildSeedUsers();

const createFallbackEngagement = (trackId, tracks, playlists) => {
  const allTrackIds = Object.keys(tracks).filter((id) => id !== trackId);
  const playlistIds = Object.keys(playlists);
  const rotatedUsers = seedUsers.filter(
    (user) => user.id !== trackExperienceMockData.viewer.id,
  );
  const pivot = Math.abs(
    trackId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0),
  );

  const sliceUsers = (start, size) =>
    Array.from(
      { length: size },
      (_, index) => rotatedUsers[(start + index) % rotatedUsers.length],
    );

  const commentUsers = sliceUsers(pivot % rotatedUsers.length, 4);

  return {
    comments: [
      normalizeComment({
        id: `comment-${trackId}-1`,
        user: commentUsers[0],
        text: `This section in ${tracks[trackId].title} really stays with me.`,
        created_at: "2026-04-02T18:00:00.000Z",
        timestamp_ms: 24000,
      }),
      normalizeComment({
        id: `comment-${trackId}-2`,
        user: commentUsers[1],
        text: "Mix feels crisp and wide all the way through.",
        created_at: "2026-04-03T09:40:00.000Z",
        timestamp_ms: 89000,
      }),
      normalizeComment({
        id: `comment-${trackId}-3`,
        user: commentUsers[2],
        text: "Would absolutely repost this.",
        created_at: "2026-04-03T20:15:00.000Z",
      }),
    ],
    likers: sliceUsers((pivot + 1) % rotatedUsers.length, 6),
    reposters: sliceUsers((pivot + 4) % rotatedUsers.length, 4),
    fans: sliceUsers((pivot + 2) % rotatedUsers.length, 5).map(
      (user, index) => ({
        ...user,
        plays: 180 - index * 18,
      }),
    ),
    relatedTrackIds: allTrackIds.slice(0, 4),
    playlistIds: playlistIds.slice(0, 3),
  };
};

const createMockStore = () => {
  const baseStore = clone(trackExperienceMockData);

  Object.keys(baseStore.tracks).forEach((trackId) => {
    if (!baseStore.engagement[trackId]) {
      baseStore.engagement[trackId] = createFallbackEngagement(
        trackId,
        baseStore.tracks,
        baseStore.playlists,
      );
    }
  });

  return baseStore;
};

let mockStore = createMockStore();

const getMockTrackOrThrow = (trackId) => {
  const track = mockStore.tracks[trackId];

  if (!track) {
    throw new Error("Track not found");
  }

  return track;
};

const getMockEngagementOrCreate = (trackId) => {
  getMockTrackOrThrow(trackId);

  if (!mockStore.engagement[trackId]) {
    mockStore.engagement[trackId] = createFallbackEngagement(
      trackId,
      mockStore.tracks,
      mockStore.playlists,
    );
  }

  return mockStore.engagement[trackId];
};

const recordMockPlay = (trackId, durationPlayedMs) => {
  const track = getMockTrackOrThrow(trackId);
  const playedAt = formatIsoNow();

  track.playCount += 1;

  const historyEntry = createTrackSummary(track, {
    played_at: playedAt,
    duration_played_ms: durationPlayedMs,
  });

  mockStore.history = [historyEntry, ...mockStore.history].slice(0, 8);
  mockStore.recentlyPlayed = [
    createTrackSummary(track, { played_at: playedAt }),
    ...mockStore.recentlyPlayed.filter((item) => item.id !== trackId),
  ].slice(0, 5);
};

export const getTrack = async (trackId, secretToken) => {
  if (useMock) {
    const track = getMockTrackOrThrow(trackId);
    getMockEngagementOrCreate(trackId);
    return clone(normalizeTrack(track));
  }

  const query = secretToken ? `?token=${secretToken}` : "";
  const payload = await request(`/tracks/${trackId}${query}`);
  const normalizedTrack = normalizeTrack(unwrapEntity(payload, ["track"]));

  if (!hasAuthToken()) {
    return normalizedTrack;
  }

  const [likedResult, repostedResult] = await Promise.allSettled([
    checkTrackLiked(trackId),
    checkTrackReposted(trackId),
  ]);

  const resolvedTrack = {
    ...normalizedTrack,
    viewerHasLiked:
      likedResult.status === "fulfilled"
        ? Boolean(likedResult.value?.liked)
        : normalizedTrack.viewerHasLiked,
    viewerHasReposted:
      repostedResult.status === "fulfilled"
        ? Boolean(repostedResult.value?.reposted)
        : normalizedTrack.viewerHasReposted,
  };

  updateViewerTrackEngagementCache(resolvedTrack);

  return resolvedTrack;
};

export const getWaveform = async (trackId) => {
  if (useMock) {
    return clone(getMockTrackOrThrow(trackId).waveform);
  }
};

const getMockLikers = (trackId) =>
  clone(getMockEngagementOrCreate(trackId).likers.map(normalizeUser));

const getMockReposters = (trackId) =>
  clone(getMockEngagementOrCreate(trackId).reposters.map(normalizeUser));

const getMockComments = (trackId, limit = 20) => {
  const items = clone(getMockEngagementOrCreate(trackId).comments).map(
    normalizeComment,
  );
  return {
    comments: items,
    totalCount: items.length,
    pagination: {
      page: 1,
      limit,
      total: items.length,
      pages: Math.ceil(items.length / Math.max(limit, 1)),
    },
  };
};

const getMockCommentReplies = (limit = 20) => ({
  replies: [],
  totalCount: 0,
  pagination: {
    page: 1,
    limit,
    total: 0,
    pages: 0,
  },
});

const getMockRelatedTracks = (trackId) => {
  const engagement = getMockEngagementOrCreate(trackId);

  return clone(
    engagement.relatedTrackIds
      .map((relatedId) => mockStore.tracks[relatedId])
      .filter(Boolean)
      .map(normalizeTrackCard),
  );
};

const getMockTrackPlaylistsData = (trackId) => {
  const engagement = getMockEngagementOrCreate(trackId);

  return clone(
    engagement.playlistIds
      .map((playlistId) => mockStore.playlists[playlistId])
      .filter(Boolean)
      .map(normalizePlaylist),
  );
};

const getMockFanLeaderboardData = (trackId) =>
  clone(getMockEngagementOrCreate(trackId).fans.map(normalizeFanEntry));

const looksLikeObjectId = (value) =>
  /^[a-f0-9]{24}$/i.test(String(value ?? "").trim());

const readCommentEntityId = (comment = {}) =>
  comment.comment_id ??
  comment.commentId ??
  comment.reply_id ??
  comment.replyId ??
  comment.id ??
  comment._id ??
  null;

const hasCommentText = (comment = {}) =>
  [comment.text, comment.content, comment.body].some(
    (value) => typeof value === "string" && value.trim() !== "",
  );

const isHydratedCommentEntity = (comment = {}) =>
  looksLikeObjectId(readCommentEntityId(comment)) && hasCommentText(comment);

export const getStreamUrl = async (trackId, options = {}) => {
  if (useMock) {
    const track = getMockTrackOrThrow(trackId);
    const playbackContext = String(options.playbackContext ?? "").toLowerCase();
    const isPreviewContext =
      playbackContext === "discovery" || playbackContext === "feed";

    return {
      url: track.audioUrl,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      playback_state: track.playbackState,
      playback_mode: isPreviewContext ? "preview" : "full",
      preview_start_seconds: isPreviewContext ? 0 : null,
      preview_duration_seconds: isPreviewContext
        ? 30
        : track.previewDurationSeconds,
      message:
        track.playbackState === "Blocked"
          ? "This track is blocked for your plan or region."
          : null,
    };
  }

  const searchParams = new URLSearchParams();

  if (typeof options === "string") {
    searchParams.set("token", options);
  } else {
    if (options.playbackContext) {
      searchParams.set("playbackContext", options.playbackContext);
    }

    if (options.secretToken) {
      searchParams.set("token", options.secretToken);
    }
  }

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return request(`/tracks/${trackId}/stream-url${query}`);
};

export const registerPlay = async (trackId, payload) => {
  if (useMock) {
    getMockTrackOrThrow(trackId);
    recordMockPlay(trackId, payload.duration_played_ms);
    return { success: true };
  }

  return request(`/tracks/${trackId}/play`, {
    method: "POST",
    body: payload,
  });
};

export const getRecentlyPlayed = async ({ page = 1, limit = 20 } = {}) => {
  if (useMock) {
    return dedupeHistoryEntriesByTrack(
      clone(mockStore.recentlyPlayed).map(normalizeHistoryEntry),
    ).slice(0, limit);
  }

  const payload = await request(
    `/users/me/recently-played?page=${page}&limit=${limit}`,
  );
  return dedupeHistoryEntriesByTrack(normalizeHistoryCollection(payload));
};

export const getListeningHistory = async ({ page = 1, limit = 20 } = {}) => {
  if (useMock) {
    return sortHistoryEntriesDescending(
      clone(mockStore.history).map(normalizeHistoryEntry),
    ).slice(0, limit);
  }

  const payload = await request(
    `/users/me/history?page=${page}&limit=${limit}`,
  );
  return normalizeHistoryCollection(payload);
};

const getMockViewerLikedTracks = () =>
  clone(
    Object.values(mockStore.tracks)
      .filter((track) => track.viewerHasLiked)
      .map(normalizeTrack),
  );

const getMockViewerRepostedTracks = () =>
  clone(
    Object.values(mockStore.tracks)
      .filter((track) => track.viewerHasReposted)
      .map(normalizeTrack),
  );

export const getViewerLikedTracks = async () => {
  if (useMock) {
    return getMockViewerLikedTracks();
  }

  if (!hasAuthToken()) {
    return [];
  }

  return readViewerTrackEngagementCollection("liked");
};

export const getViewerRepostedTracks = async () => {
  if (useMock) {
    return getMockViewerRepostedTracks();
  }

  if (!hasAuthToken()) {
    return [];
  }

  return readViewerTrackEngagementCollection("reposted");
};

export const clearListeningHistory = async () => {
  if (useMock) {
    mockStore.history = [];
    mockStore.recentlyPlayed = [];
    return { message: "History cleared successfully" };
  }

  return request("/users/me/history", { method: "DELETE" });
};

export const toggleLike = async (trackId, shouldLike) => {
  if (useMock) {
    const track = getMockTrackOrThrow(trackId);
    const engagement = getMockEngagementOrCreate(trackId);

    if (shouldLike) {
      track.viewerHasLiked = true;
      if (!engagement.likers.some((user) => user.id === mockStore.viewer.id)) {
        engagement.likers = [clone(mockStore.viewer), ...engagement.likers];
      }
    } else {
      track.viewerHasLiked = false;
      engagement.likers = engagement.likers.filter(
        (user) => user.id !== mockStore.viewer.id,
      );
    }

    track.likeCount = Math.max(track.likeCount + (shouldLike ? 1 : -1), 0);
    return { success: true };
  }

  const method = shouldLike ? "POST" : "DELETE";
  try {
    const payload = await request(`/tracks/${trackId}/like`, {
      method,
      body: shouldLike ? {} : undefined,
    });
    updateViewerTrackEngagementCache({
      id: trackId,
      trackId,
      viewerHasLiked: shouldLike,
    });
    return payload;
  } catch (err) {
    // 409 = already in the requested state — treat as success
    if (err?.status === 409 || err?.message?.includes("409")) {
      updateViewerTrackEngagementCache({
        id: trackId,
        trackId,
        viewerHasLiked: shouldLike,
      });
      return { success: true };
    }
    throw err;
  }
};

export const getLikers = async (trackId, { page = 1, limit = 20 } = {}) => {
  if (useMock) {
    return clone(getMockEngagementOrCreate(trackId).likers.map(normalizeUser));
  }

  const payload = await request(
    `/tracks/${trackId}/likes?page=${page}&limit=${limit}`,
    { auth: false },
  );
  return unwrapCollection(payload).map(normalizeUser);
};

export const checkTrackLiked = async (trackId) => {
  if (useMock) {
    return { liked: Boolean(getMockTrackOrThrow(trackId).viewerHasLiked) };
  }

  const payload = await request(`/tracks/${trackId}/liked`);
  return {
    liked: Boolean(
      payload?.liked ?? payload?.is_liked ?? payload?.viewerHasLiked,
    ),
  };
};

export const toggleRepost = async (trackId, shouldRepost) => {
  if (useMock) {
    const track = getMockTrackOrThrow(trackId);
    const engagement = getMockEngagementOrCreate(trackId);

    if (shouldRepost) {
      track.viewerHasReposted = true;
      if (
        !engagement.reposters.some((user) => user.id === mockStore.viewer.id)
      ) {
        engagement.reposters = [
          clone(mockStore.viewer),
          ...engagement.reposters,
        ];
      }
    } else {
      track.viewerHasReposted = false;
      engagement.reposters = engagement.reposters.filter(
        (user) => user.id !== mockStore.viewer.id,
      );
    }

    track.repostCount = Math.max(
      track.repostCount + (shouldRepost ? 1 : -1),
      0,
    );
    return { success: true };
  }

  const method = shouldRepost ? "POST" : "DELETE";
  try {
    const payload = await request(`/tracks/${trackId}/repost`, {
      method,
      body: shouldRepost ? {} : undefined,
    });
    updateViewerTrackEngagementCache({
      id: trackId,
      trackId,
      viewerHasReposted: shouldRepost,
    });
    return payload;
  } catch (err) {
    // 409 = already in the requested state — treat as success
    if (err?.status === 409 || err?.message?.includes("409")) {
      updateViewerTrackEngagementCache({
        id: trackId,
        trackId,
        viewerHasReposted: shouldRepost,
      });
      return { success: true };
    }
    throw err;
  }
};

export const getReposters = async (trackId, { page = 1, limit = 20 } = {}) => {
  if (useMock) {
    return clone(
      getMockEngagementOrCreate(trackId).reposters.map(normalizeUser),
    );
  }

  const payload = await request(
    `/tracks/${trackId}/reposts?page=${page}&limit=${limit}`,
    {
      auth: false,
    },
  );
  return unwrapCollection(payload).map(normalizeUser);
};

export const checkTrackReposted = async (trackId) => {
  if (useMock) {
    return {
      reposted: Boolean(getMockTrackOrThrow(trackId).viewerHasReposted),
    };
  }

  const payload = await request(`/tracks/${trackId}/reposted`);
  return {
    reposted: Boolean(
      payload?.reposted ?? payload?.is_reposted ?? payload?.viewerHasReposted,
    ),
  };
};

export const getComments = async (trackId, { page = 1, limit = 20 } = {}) => {
  if (useMock) {
    const comments = clone(getMockEngagementOrCreate(trackId).comments).map(
      normalizeComment,
    );
    return {
      comments,
      totalCount: comments.length,
      pagination: resolvePagination(
        {
          total: comments.length,
          pages: Math.ceil(comments.length / Math.max(limit, 1)),
        },
        page,
        limit,
      ),
    };
  }

  const payload = await requestWithOptionalAuth(
    `/tracks/${trackId}/comments?page=${page}&limit=${limit}`,
  );
  const comments = unwrapCollection(payload).map(normalizeComment);
  const totalCount =
    payload?.comments_count ?? payload?.pagination?.total ?? comments.length;
  return {
    comments,
    totalCount,
    pagination: resolvePagination(
      {
        ...payload,
        comments_count: totalCount,
      },
      page,
      limit,
    ),
  };
};

export const createComment = async (trackId, payload) => {
  if (useMock) {
    const engagement = getMockEngagementOrCreate(trackId);

    const comment = normalizeComment({
      id: `comment-${Date.now()}`,
      text: payload.text,
      timestamp_ms: payload.timestamp_ms,
      created_at: formatIsoNow(),
      user: mockStore.viewer,
    });

    engagement.comments = [...engagement.comments, comment];
    getMockTrackOrThrow(trackId).commentCount += 1;
    return clone(comment);
  }

  const response = await request(`/tracks/${trackId}/comments`, {
    method: "POST",
    body: buildCommentMutationBody(payload),
  });

  const entity = unwrapEntity(response, ["comment", "reply"]);
  if (isHydratedCommentEntity(entity)) {
    return normalizeComment(entity, {
      assumeViewerOwnership: true,
    });
  }

  return null;
};

export const deleteComment = async (commentId, trackId) => {
  if (useMock) {
    const engagement = getMockEngagementOrCreate(trackId);
    engagement.comments = engagement.comments.filter((c) => c.id !== commentId);
    getMockTrackOrThrow(trackId).commentCount -= 1;
    return { success: true };
  }

  return request(`/comments/${commentId}`, { method: "DELETE" });
};

export const updateComment = async (commentId, text) => {
  if (useMock) {
    for (const engagement of Object.values(mockStore.engagement)) {
      const comment = engagement.comments.find((c) => c.id === commentId);
      if (comment) {
        comment.text = text;
        comment.isEdited = true;
        return clone(normalizeComment(comment));
      }
    }
    throw new Error("Comment not found");
  }

  const payload = await request(`/comments/${commentId}`, {
    method: "PATCH",
    body: {
      text: String(text ?? "").trim(),
      content: String(text ?? "").trim(),
    },
  });

  const entity = unwrapEntity(payload, ["comment", "reply"]);
  if (isHydratedCommentEntity(entity)) {
    return normalizeComment(entity, {
      assumeViewerOwnership: true,
    });
  }

  return {
    id: commentId,
    text: String(text ?? "").trim(),
    isEdited: true,
    isOwnedByViewer: true,
    canEdit: true,
    canDelete: true,
  };
};

export const getCommentReplies = async (
  commentId,
  { page = 1, limit = 20 } = {},
) => {
  if (useMock) {
    return {
      replies: [],
      totalCount: 0,
      pagination: resolvePagination({ total: 0, pages: 0 }, page, limit),
    };
  }

  const payload = await requestWithOptionalAuth(
    `/comments/${commentId}/replies?page=${page}&limit=${limit}`,
  );
  const replies = unwrapCollection(payload).map(normalizeComment);
  return {
    replies,
    totalCount:
      payload?.replies_count ?? payload?.pagination?.total ?? replies.length,
    pagination: resolvePagination(
      {
        ...payload,
        replies_count:
          payload?.replies_count ??
          payload?.pagination?.total ??
          replies.length,
      },
      page,
      limit,
    ),
  };
};

export const getRelatedTracks = async (trackId) => {
  if (useMock) {
    const engagement = getMockEngagementOrCreate(trackId);
    return clone(
      engagement.relatedTrackIds
        .map((relatedId) => mockStore.tracks[relatedId])
        .filter(Boolean)
        .map(normalizeTrackCard),
    );
  }

  try {
    const payload = await request(`/tracks/${trackId}/related`, {
      auth: false,
    });
    return unwrapCollection(payload).map(normalizeTrackCard);
  } catch (err) {
    if (err?.message?.includes("404")) return [];
    throw err;
  }
};

export const getDownloadUrl = async (trackId) => {
  if (useMock) {
    const track = getMockTrackOrThrow(trackId);
    return { url: track.audioUrl };
  }

  return request(`/tracks/${trackId}/download-url`);
};

// ── Module 4: Track Management ─────────────────────────────────────────────

export const TRACK_GENRES = [
  "Electronic",
  "Hip-Hop",
  "Rock",
  "Pop",
  "Jazz",
  "R&B",
  "Classical",
  "Country",
  "Reggae",
  "Metal",
  "Folk",
  "Blues",
  "Latin",
  "Punk",
  "Soul",
];

/**
 * POST /tracks — multipart form upload.
 * @param {Object} fields - { title, genre, description?, tags?, preview_start_seconds?, lyrics? }
 * @param {File} audioFile
 * @param {File} artworkFile
 */
export const createTrack = async (fields, audioFile, artworkFile) => {
  const formData = new FormData();
  formData.append("audio_file", audioFile);
  formData.append("artwork_file", artworkFile);
  formData.append("title", fields.title);
  formData.append("genre", fields.genre);
  if (fields.description) formData.append("description", fields.description);
  if (fields.lyrics) formData.append("lyrics", fields.lyrics);
  if (fields.preview_start_seconds != null)
    formData.append(
      "preview_start_seconds",
      String(fields.preview_start_seconds),
    );
  const tags = Array.isArray(fields.tags) ? fields.tags : [];
  tags.forEach((tag) => formData.append("tags", tag));

  return request("/tracks", { method: "POST", body: formData });
};

/** GET /tracks/:id/status — poll transcoding state */
export const getTrackStatus = async (trackId) => {
  return request(`/tracks/${trackId}/status`);
};

/** PATCH /tracks/:id — update metadata (owner only) */
export const updateTrackMetadata = async (trackId, fields) => {
  return request(`/tracks/${trackId}`, { method: "PATCH", body: fields });
};

/** DELETE /tracks/:id */
export const deleteTrack = async (trackId) => {
  return request(`/tracks/${trackId}`, { method: "DELETE" });
};

/** PUT /tracks/:id/artwork — replace cover image */
export const updateTrackArtwork = async (trackId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return request(`/tracks/${trackId}/artwork`, {
    method: "PUT",
    body: formData,
  });
};

/** GET /artists/:id/tracks */
export const getArtistTracks = async (
  artistId,
  { page = 1, limit = 20 } = {},
) => {
  const payload = await request(
    `/artists/${artistId}/tracks?page=${page}&limit=${limit}`,
  );
  return {
    tracks: unwrapCollection(payload).map(normalizeTrack),
    total: payload?.total ?? 0,
  };
};

/** GET /tracks/:id/lyrics */
export const getTrackLyrics = async (trackId) => {
  try {
    const payload = await request(`/tracks/${trackId}/lyrics`);
    return payload?.lyrics ?? null;
  } catch {
    return null;
  }
};

export const getTrackPlaylists = async (trackId) => {
  if (useMock) {
    const engagement = getMockEngagementOrCreate(trackId);

    return clone(
      engagement.playlistIds
        .map((playlistId) => mockStore.playlists[playlistId])
        .filter(Boolean)
        .map(normalizePlaylist),
    );
  }

  try {
    const payload = await request(`/tracks/${trackId}/playlists`, {
      auth: false,
    });
    return unwrapCollection(payload).map(normalizePlaylist);
  } catch (err) {
    if (err?.message?.includes("404")) return [];
    throw err;
  }
};

// Album engagement endpoints (Module 6)

export const toggleAlbumLike = async (albumId, shouldLike) => {
  if (useMock) {
    return {
      success: true,
      message: shouldLike
        ? "Album liked successfully."
        : "Album unliked successfully.",
    };
  }

  const method = shouldLike ? "POST" : "DELETE";
  return request(`/albums/${albumId}/like`, { method });
};

export const getAlbumLikers = async (
  albumId,
  { page = 1, limit = 20 } = {},
) => {
  if (useMock) {
    return {
      likers: [],
      likes_count: 0,
      pagination: { page, limit, total: 0, pages: 0 },
    };
  }

  const payload = await request(
    `/albums/${albumId}/likes?page=${page}&limit=${limit}`,
    { auth: false },
  );
  return {
    likers: unwrapCollection(payload).map(normalizeUser),
    likes_count: payload?.likes_count ?? 0,
    pagination: payload?.pagination ?? { page, limit, total: 0, pages: 0 },
  };
};

export const checkAlbumLiked = async (albumId) => {
  if (useMock) {
    return { album_id: albumId, liked: false };
  }

  const payload = await request(`/albums/${albumId}/liked`);
  return {
    album_id: albumId,
    liked: Boolean(payload?.liked ?? payload?.is_liked),
  };
};

export const toggleAlbumRepost = async (albumId, shouldRepost) => {
  if (useMock) {
    return {
      success: true,
      message: shouldRepost
        ? "Album reposted successfully."
        : "Album unreposted successfully.",
    };
  }

  const method = shouldRepost ? "POST" : "DELETE";
  return request(`/albums/${albumId}/repost`, { method });
};

export const getAlbumReposters = async (
  albumId,
  { page = 1, limit = 20 } = {},
) => {
  if (useMock) {
    return {
      reposters: [],
      reposts_count: 0,
      pagination: { page, limit, total: 0, pages: 0 },
    };
  }

  const payload = await request(
    `/albums/${albumId}/reposts?page=${page}&limit=${limit}`,
    { auth: false },
  );
  return {
    reposters: unwrapCollection(payload).map(normalizeUser),
    reposts_count: payload?.reposts_count ?? 0,
    pagination: payload?.pagination ?? { page, limit, total: 0, pages: 0 },
  };
};

export const checkAlbumReposted = async (albumId) => {
  if (useMock) {
    return { album_id: albumId, reposted: false };
  }

  const payload = await request(`/albums/${albumId}/reposted`);
  return {
    album_id: albumId,
    reposted: Boolean(payload?.reposted ?? payload?.is_reposted),
  };
};

export const getFanLeaderboard = async (trackId) => {
  if (useMock) {
    return clone(
      getMockEngagementOrCreate(trackId).fans.map(normalizeFanEntry),
    );
  }

  try {
    const payload = await request(`/tracks/${trackId}/fans`, { auth: false });
    return unwrapCollection(payload).map(normalizeFanEntry);
  } catch (err) {
    if (err?.message?.includes("404")) return [];
    throw err;
  }
};

// -- Axios instance for Omar's playlist/premium modules --
import axios from "axios";

export const pulsifyAxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

pulsifyAxiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  // When sending FormData, remove the default JSON content-type
  // so the browser can set multipart/form-data with the correct boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

pulsifyAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && getAuthToken()) {
      clearAuthToken();
    }

    return Promise.reject(error);
  },
);
