import axios from 'axios'
import { trackExperienceMockData } from '../mock/trackExperienceData'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
const useMock =
  String(
    import.meta.env.VITE_USE_MOCKS ??
      import.meta.env.VITE_USE_MOCK_API ??
      import.meta.env.VITE_USE_MOCK ??
      'false',
  ).toLowerCase() === 'true'
const allowMockFallback =
  String(import.meta.env.VITE_ALLOW_MOCK_FALLBACK ?? 'true').toLowerCase() !== 'false'
const mockTrackIds = new Set(Object.keys(trackExperienceMockData.tracks ?? {}))

const clone = (value) => JSON.parse(JSON.stringify(value))

const formatIsoNow = () => new Date().toISOString()
const MOCK_LIBRARY_STORAGE_KEY = 'pulsify_mock_library_state_v1'
const DEFAULT_MOCK_VIEWER_KEY = String(trackExperienceMockData.viewer?.id ?? 'usr-viewer')
const DEFAULT_MOCK_LIBRARY_STATE = {
  [DEFAULT_MOCK_VIEWER_KEY]: {
    recentlyPlayed: clone(trackExperienceMockData.recentlyPlayed ?? []),
    history: clone(trackExperienceMockData.history ?? []),
  },
}
let mockLibraryStateCache = clone(DEFAULT_MOCK_LIBRARY_STATE)

const readStoredJson = (key) => {
  if (typeof window === 'undefined') return null

  const rawValue = window.localStorage.getItem(key)
  if (!rawValue) return null

  try {
    return JSON.parse(rawValue)
  } catch {
    return null
  }
}

const normalizePlaybackState = (value) => {
  const normalizedValue = String(value ?? '').toLowerCase()

  if (normalizedValue === 'blocked') return 'Blocked'
  if (normalizedValue === 'preview') return 'Preview'
  return 'Playable'
}

const sortHistoryEntriesDescending = (items = []) =>
  [...items].sort((left, right) => {
    const leftTimestamp = new Date(left.played_at ?? left.playedAt ?? 0).getTime()
    const rightTimestamp = new Date(right.played_at ?? right.playedAt ?? 0).getTime()

    return rightTimestamp - leftTimestamp
  })

const dedupeHistoryEntriesByTrack = (items = []) => {
  const itemMap = new Map()

  sortHistoryEntriesDescending(items).forEach((item) => {
    if (!item?.id || itemMap.has(item.id)) return
    itemMap.set(item.id, item)
  })

  return [...itemMap.values()]
}

const paginateItems = (items = [], { page = 1, limit = 20 } = {}) => {
  const safePage = Math.max(Number(page) || 1, 1)
  const safeLimit = Math.max(Number(limit) || 20, 1)
  const total = items.length
  const pages = Math.max(1, Math.ceil(total / safeLimit))
  const startIndex = (safePage - 1) * safeLimit

  return {
    items: items.slice(startIndex, startIndex + safeLimit),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages,
    },
  }
}

export const getStoredViewerIdentity = () => {
  if (typeof window === 'undefined') {
    return {
      userId: '',
      username: '',
      displayName: '',
    }
  }

  const storedUser =
    readStoredJson('user') ??
    readStoredJson('currentUser') ??
    readStoredJson('profile') ??
    {}

  return {
    userId:
      window.localStorage.getItem('userId') ??
      window.localStorage.getItem('user_id') ??
      storedUser.id ??
      storedUser.user_id ??
      '',
    username:
      window.localStorage.getItem('username') ??
      storedUser.username ??
      '',
    displayName:
      window.localStorage.getItem('display_name') ??
      window.localStorage.getItem('displayName') ??
      storedUser.display_name ??
      storedUser.displayName ??
      '',
  }
}

const getActiveMockViewerKey = () => {
  const viewerIdentity = getStoredViewerIdentity()
  const candidateKey =
    viewerIdentity.userId ||
    viewerIdentity.username ||
    DEFAULT_MOCK_VIEWER_KEY

  return String(candidateKey || DEFAULT_MOCK_VIEWER_KEY).trim() || DEFAULT_MOCK_VIEWER_KEY
}

const readMockLibraryState = () => {
  if (typeof window === 'undefined') {
    return clone(mockLibraryStateCache)
  }

  const storedState = readStoredJson(MOCK_LIBRARY_STORAGE_KEY)
  if (!storedState || typeof storedState !== 'object') {
    return clone(mockLibraryStateCache)
  }

  const mergedState = {
    ...DEFAULT_MOCK_LIBRARY_STATE,
    ...storedState,
  }

  mockLibraryStateCache = clone(mergedState)
  return clone(mockLibraryStateCache)
}

const writeMockLibraryState = (nextState) => {
  mockLibraryStateCache = clone(nextState)

  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    MOCK_LIBRARY_STORAGE_KEY,
    JSON.stringify(mockLibraryStateCache),
  )
}

const getMockLibrarySeedForViewer = (viewerKey) =>
  viewerKey === DEFAULT_MOCK_VIEWER_KEY
    ? clone(DEFAULT_MOCK_LIBRARY_STATE[DEFAULT_MOCK_VIEWER_KEY])
    : {
        recentlyPlayed: [],
        history: [],
      }

const ensureMockLibraryForViewer = (viewerKey = getActiveMockViewerKey()) => {
  const nextState = readMockLibraryState()

  if (!nextState[viewerKey]) {
    nextState[viewerKey] = getMockLibrarySeedForViewer(viewerKey)
    writeMockLibraryState(nextState)
  }

  return clone(nextState[viewerKey])
}

const updateMockLibraryForViewer = (
  updater,
  viewerKey = getActiveMockViewerKey(),
) => {
  const nextState = readMockLibraryState()
  const currentViewerState =
    nextState[viewerKey] ?? getMockLibrarySeedForViewer(viewerKey)
  const nextViewerState =
    updater(clone(currentViewerState)) ?? clone(currentViewerState)

  nextState[viewerKey] = {
    recentlyPlayed: dedupeHistoryEntriesByTrack(
      clone(nextViewerState.recentlyPlayed ?? []),
    ),
    history: sortHistoryEntriesDescending(clone(nextViewerState.history ?? [])),
  }

  writeMockLibraryState(nextState)
  return clone(nextState[viewerKey])
}

const getMockRecentlyPlayedEntries = () =>
  dedupeHistoryEntriesByTrack(ensureMockLibraryForViewer().recentlyPlayed ?? [])

const getMockHistoryEntries = () =>
  sortHistoryEntriesDescending(ensureMockLibraryForViewer().history ?? [])

const getAuthToken = () => {
  if (typeof window === 'undefined') return import.meta.env.VITE_AUTH_TOKEN ?? ''

  return (
    window.localStorage.getItem('pulsify_access_token') ??
    window.localStorage.getItem('pulsify_token') ??
    window.localStorage.getItem('accessToken') ??
    window.localStorage.getItem('pulsify_jwt_token') ??
    import.meta.env.VITE_AUTH_TOKEN ??
    ''
  )
}

export const hasAuthToken = () => Boolean(getAuthToken())

export const readAuthToken = () => getAuthToken()

export const saveAuthToken = (token) => {
  if (typeof window === 'undefined') return

  const normalizedToken = String(token ?? '').trim()
  if (!normalizedToken) return

  window.localStorage.setItem('accessToken', normalizedToken)
  window.localStorage.setItem('pulsify_token', normalizedToken)
  window.localStorage.setItem('pulsify_access_token', normalizedToken)
}

export const clearAuthToken = () => {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem('accessToken')
  window.localStorage.removeItem('pulsify_token')
  window.localStorage.removeItem('pulsify_access_token')
  window.localStorage.removeItem('pulsify_jwt_token')
}

const shouldUseMockFallback = (error) => {
  if (useMock || !allowMockFallback) return false

  return error?.status === 401 || error?.name === 'TypeError'
}

const withMockFallback = async (requester, fallback) => {
  if (!useMock && allowMockFallback && !hasAuthToken()) {
    return fallback()
  }

  try {
    return await requester()
  } catch (error) {
    if (shouldUseMockFallback(error)) {
      console.warn('Falling back to mock track data.', error)
      return fallback()
    }

    throw error
  }
}

const shouldUseKnownMockTrackFallback = (trackId, error) =>
  mockTrackIds.has(trackId) && (error?.status === 400 || error?.status === 404)

const withTrackMockFallback = async (trackId, requester, fallback) => {
  if (!useMock && allowMockFallback && !hasAuthToken()) {
    return fallback()
  }

  try {
    return await requester()
  } catch (error) {
    if (shouldUseMockFallback(error) || shouldUseKnownMockTrackFallback(trackId, error)) {
      console.warn('Falling back to mock track data.', error)
      return fallback()
    }

    throw error
  }
}

const normalizeUser = (user = {}) => ({
  id: user.id ?? user.user_id ?? `user-${Math.random().toString(16).slice(2, 10)}`,
  name: user.name ?? user.display_name ?? user.username ?? 'Unknown listener',
  handle: user.handle ?? (user.username ? `@${user.username}` : '@listener'),
  avatar:
    user.avatar ??
    user.avatar_url ??
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
})

const normalizeComment = (comment = {}) => {
  const hasEmbeddedUser = Boolean(comment.user)
  const viewerIdentity = getStoredViewerIdentity()
  const normalizedUser = hasEmbeddedUser
    ? normalizeUser(comment.user)
    : normalizeUser({
        id: comment.user_id,
        username: comment.username,
        display_name: comment.display_name,
        avatar_url: comment.avatar_url,
      })

  return {
    id: comment.id ?? comment.comment_id ?? `comment-${Math.random().toString(16).slice(2, 10)}`,
    text: comment.text ?? '',
    timestamp_ms:
      comment.timestamp_ms ??
      (typeof comment.timestamp_seconds === 'number'
        ? Math.round(comment.timestamp_seconds * 1000)
        : typeof comment.time === 'number'
          ? Math.round(comment.time * 1000)
          : null),
    created_at: comment.created_at ?? formatIsoNow(),
    user: normalizedUser,
    likesCount: comment.likesCount ?? comment.likes_count ?? 0,
    repliesCount: comment.repliesCount ?? comment.replies_count ?? 0,
    isEdited: Boolean(comment.isEdited ?? comment.is_edited),
    isDeleted: Boolean(comment.isDeleted ?? comment.is_deleted ?? comment.deleted_at),
    parentCommentId: comment.parentCommentId ?? comment.parent_comment_id ?? null,
    isOwnedByViewer: Boolean(
      (viewerIdentity.userId && viewerIdentity.userId === normalizedUser.id) ||
        (viewerIdentity.username &&
          viewerIdentity.username.toLowerCase() ===
            String(comment.username ?? normalizedUser.handle ?? '')
              .replace(/^@/, '')
              .toLowerCase()) ||
        (viewerIdentity.displayName &&
          viewerIdentity.displayName.toLowerCase() === normalizedUser.name.toLowerCase()),
    ),
  }
}

const createWaveform = (seed) =>
  Array.from({ length: 140 }, (_, index) => {
    const primary = (Math.sin((index + seed) * 0.43) + 1) / 2
    const secondary = (Math.cos((index + seed) * 0.19) + 1) / 2
    return Number((0.16 + primary * 0.5 + secondary * 0.14).toFixed(3))
  })

const normalizeTrack = (track = {}) => ({
  id: track.id ?? track.track_id ?? 'trk-2026-014',
  title: track.title ?? track.track_title ?? 'Untitled track',
  artist: track.artist ?? track.artist_name ?? 'Unknown artist',
  artistHandle: track.artistHandle ?? track.artist_handle ?? '@artist',
  artistAvatar: track.artistAvatar ?? track.artist_avatar ?? track.cover ?? track.cover_art_url ?? '',
  cover: track.cover ?? track.cover_art_url ?? '',
  audioUrl: track.audioUrl ?? track.audio_url ?? '',
  duration: track.duration ?? track.duration_seconds ?? 0,
  description: track.description ?? '',
  genre: track.genre ?? 'Electronic',
  location: track.location ?? 'Cairo, Egypt',
  postedAt: track.postedAt ?? track.posted_at ?? formatIsoNow(),
  playCount: track.playCount ?? track.play_count ?? track.plays ?? 0,
  likeCount: track.likeCount ?? track.like_count ?? track.likes ?? 0,
  repostCount: track.repostCount ?? track.repost_count ?? track.reposts ?? 0,
  commentCount:
    track.commentCount ??
    track.comment_count ??
    track.comments_count ??
    track.commentsCount ??
    (Array.isArray(track.comments) ? track.comments.length : 0),
  viewerHasLiked: Boolean(track.viewerHasLiked ?? track.viewer_has_liked),
  viewerHasReposted: Boolean(track.viewerHasReposted ?? track.viewer_has_reposted),
  playbackState: normalizePlaybackState(track.playbackState ?? track.playback_state),
  previewStartSeconds: track.previewStartSeconds ?? track.preview_start_seconds ?? 0,
  previewDurationSeconds: track.previewDurationSeconds ?? track.preview_duration_seconds ?? 0,
  waveform:
    Array.isArray(track.waveform) && track.waveform.length
      ? track.waveform
      : createWaveform((track.id ?? 'track').length),
  typeLabel: track.typeLabel ?? 'Music',
})

const normalizeTrackCard = (track = {}) => {
  const normalizedTrack = normalizeTrack(track)

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
    audioUrl: normalizedTrack.audioUrl,
    playbackState: normalizedTrack.playbackState,
    previewDurationSeconds: normalizedTrack.previewDurationSeconds,
    waveform: normalizedTrack.waveform,
    typeLabel: normalizedTrack.typeLabel,
    viewerHasLiked: normalizedTrack.viewerHasLiked,
    viewerHasReposted: normalizedTrack.viewerHasReposted,
  }
}

const normalizePlaylist = (playlist = {}) => ({
  id: playlist.id ?? playlist.playlistId ?? `playlist-${Math.random().toString(16).slice(2, 8)}`,
  title: playlist.title ?? playlist.playlistName ?? 'Untitled playlist',
  creatorName: playlist.creatorName ?? playlist.creatorId ?? 'Unknown curator',
  creatorHandle: playlist.creatorHandle ?? '@playlist',
  cover: playlist.cover ?? playlist.thumbnailUrl ?? '',
  likes: playlist.likes ?? playlist.likeCount ?? 0,
  trackCount: playlist.trackCount ?? 0,
})

const normalizeFanEntry = (entry = {}) => ({
  ...normalizeUser(entry),
  plays: entry.plays ?? entry.playCount ?? 0,
})

const unwrapCollection = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  if (Array.isArray(payload?.comments)) return payload.comments
  if (Array.isArray(payload?.tracks)) return payload.tracks
  if (Array.isArray(payload?.users)) return payload.users
  if (Array.isArray(payload?.history)) return payload.history
  if (Array.isArray(payload?.playlists)) return payload.playlists
  if (Array.isArray(payload?.fans)) return payload.fans
  return []
}

const normalizeStreamInfo = (payload = {}) => {
  const accessPolicy = normalizePlaybackState(
    payload.access_policy ?? payload.playback_state
  )
  const playbackMode = String(payload.playback_mode ?? '').toLowerCase()
  const hasPreviewWindow =
    Number.isFinite(Number(payload.preview_duration_seconds)) &&
    Number(payload.preview_duration_seconds) > 0
  const playbackState =
    accessPolicy === 'Blocked'
      ? 'Blocked'
      : playbackMode === 'preview' || hasPreviewWindow
        ? 'Preview'
        : 'Playable'

  return {
    url: payload.url ?? '',
    expires_at: payload.expires_at ?? null,
    access_policy: accessPolicy,
    playback_mode: playbackMode || (playbackState === 'Preview' ? 'preview' : 'full'),
    playback_state: playbackState,
    preview_start_seconds: Number(payload.preview_start_seconds ?? 0) || 0,
    preview_duration_seconds: payload.preview_duration_seconds ?? null,
    message: payload.message ?? null,
  }
}

const getHistoryTrackSource = (entry = {}) =>
  entry.track ?? entry.song ?? entry.item ?? entry.audio ?? entry

const normalizeHistoryEntry = (entry = {}) => {
  const trackSource = getHistoryTrackSource(entry)
  const normalizedTrack = normalizeTrack(trackSource)
  const resolvedTrackId =
    trackSource.id ??
    trackSource.track_id ??
    trackSource.trackId ??
    entry.id ??
    entry.track_id ??
    entry.trackId

  return {
    id:
      resolvedTrackId ??
      normalizedTrack.id ??
      `history-${Math.random().toString(16).slice(2, 10)}`,
    title: normalizedTrack.title,
    artist: normalizedTrack.artist,
    cover: normalizedTrack.cover,
    duration: normalizedTrack.duration,
    played_at:
      entry.played_at ??
      entry.playedAt ??
      entry.last_played_at ??
      entry.lastPlayedAt ??
      entry.created_at ??
      formatIsoNow(),
    duration_played_ms:
      entry.duration_played_ms ??
      entry.durationPlayedMs ??
      entry.played_duration_ms ??
      entry.progress_ms ??
      entry.listened_ms ??
      normalizedTrack.duration * 1000,
  }
}

const normalizeHistoryCollection = (payload) =>
  sortHistoryEntriesDescending(unwrapCollection(payload).map(normalizeHistoryEntry))

const normalizePagedComments = (payload, fallbackItems = []) => {
  const items = unwrapCollection(payload).map(normalizeComment)
  const totalCount = Number(
    payload?.comments_count ??
      payload?.replies_count ??
      payload?.total ??
      payload?.count ??
      payload?.pagination?.total,
  )
  const page = Number(payload?.page ?? payload?.pagination?.page ?? 1)
  const limit = Number((payload?.limit ?? payload?.pagination?.limit ?? items.length) || 20)
  const pages = Number(payload?.pages ?? payload?.pagination?.pages)

  return {
    items,
    totalCount: Number.isFinite(totalCount) ? totalCount : items.length || fallbackItems.length,
    pagination: {
      page: Number.isFinite(page) ? page : 1,
      limit: Number.isFinite(limit) ? limit : Math.max(items.length, 1),
      total: Number.isFinite(totalCount) ? totalCount : items.length || fallbackItems.length,
      pages:
        Number.isFinite(pages) && pages > 0
          ? pages
          : Math.max(
              1,
              Math.ceil(
                (Number.isFinite(totalCount) ? totalCount : items.length || fallbackItems.length) /
                  Math.max(Number.isFinite(limit) ? limit : items.length || 20, 1),
              ),
            ),
    },
  }
}

const normalizeTargetResource = (targetType = 'tracks') => {
  const normalized = String(targetType ?? 'tracks').toLowerCase()

  if (normalized === 'track' || normalized === 'tracks') return 'tracks'
  if (normalized === 'album' || normalized === 'albums') return 'albums'
  return normalized
}

const request = async (path, { method = 'GET', body, auth = true } = {}) => {
  const headers = {
    Accept: 'application/json',
  }

  const token = getAuthToken()
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`
  }

  const isFormData = body instanceof FormData
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  })

  if (!response.ok) {
    let payload = null
    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      payload = await response.json().catch(() => null)
    } else {
      payload = await response.text().catch(() => '')
    }

    const message =
      payload?.message ||
      (typeof payload === 'string' ? payload : '') ||
      `Request failed: ${response.status}`

    const error = new Error(message)
    error.status = response.status
    error.payload = payload
    throw error
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    return null
  }

  return response.json()
}

const createTrackSummary = (track, overrides = {}) => ({
  id: track.id,
  title: track.title,
  artist: track.artist,
  cover: track.cover,
  duration: track.duration,
  played_at: overrides.played_at ?? formatIsoNow(),
  duration_played_ms: overrides.duration_played_ms ?? track.duration * 1000,
})

const buildTrackListFromIds = (trackIds = []) =>
  trackIds
    .map((trackId) => mockStore.tracks[trackId])
    .filter(Boolean)
    .map(normalizeTrackCard)

const buildSeedUsers = () => {
  const userMap = new Map()

  const writeUser = (user) => {
    const normalized = normalizeUser(user)
    userMap.set(normalized.id, normalized)
  }

  writeUser(trackExperienceMockData.viewer)

  Object.values(trackExperienceMockData.engagement).forEach((entry) => {
    ;(entry.comments ?? []).forEach((comment) => writeUser(comment.user))
    ;(entry.likers ?? []).forEach(writeUser)
    ;(entry.reposters ?? []).forEach(writeUser)
    ;(entry.fans ?? []).forEach(writeUser)
  })

  return [...userMap.values()]
}

const seedUsers = buildSeedUsers()

const createSeedRepliesForComments = (comments = []) => {
  if (!comments.length) return {}

  const otherUsers = seedUsers.filter((user) => user.id !== trackExperienceMockData.viewer.id)
  const replies = {}

  comments.slice(0, 2).forEach((comment, index) => {
    const responder = otherUsers[(index + 2) % otherUsers.length]
    replies[comment.id] = [
      normalizeComment({
        id: `seed-reply-${comment.id}-1`,
        parent_comment_id: comment.id,
        user: responder,
        text:
          index === 0
            ? 'That exact moment is why I left this on repeat.'
            : 'Agreed. The groove locks in hard there.',
        created_at: `2026-04-0${index + 2}T22:10:00.000Z`,
      }),
    ]
  })

  return replies
}

const createFallbackEngagement = (trackId, tracks, playlists) => {
  const allTrackIds = Object.keys(tracks).filter((id) => id !== trackId)
  const playlistIds = Object.keys(playlists)
  const rotatedUsers = seedUsers.filter((user) => user.id !== trackExperienceMockData.viewer.id)
  const pivot = Math.abs(trackId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0))

  const sliceUsers = (start, size) =>
    Array.from({ length: size }, (_, index) => rotatedUsers[(start + index) % rotatedUsers.length])

  const commentUsers = sliceUsers(pivot % rotatedUsers.length, 4)

  const baseComments = [
    normalizeComment({
      id: `comment-${trackId}-1`,
      user: commentUsers[0],
      text: `This section in ${tracks[trackId].title} really stays with me.`,
      created_at: '2026-04-02T18:00:00.000Z',
      timestamp_ms: 24000,
      replies_count: 2,
    }),
    normalizeComment({
      id: `comment-${trackId}-2`,
      user: commentUsers[1],
      text: 'Mix feels crisp and wide all the way through.',
      created_at: '2026-04-03T09:40:00.000Z',
      timestamp_ms: 89000,
      replies_count: 1,
    }),
    normalizeComment({
      id: `comment-${trackId}-3`,
      user: commentUsers[2],
      text: 'Would absolutely repost this.',
      created_at: '2026-04-03T20:15:00.000Z',
    }),
  ]

  return {
    comments: baseComments,
    replies: {
      [baseComments[0].id]: [
        normalizeComment({
          id: `reply-${trackId}-1`,
          parent_comment_id: baseComments[0].id,
          user: commentUsers[3],
          text: 'Same here, especially when the pads open up.',
          created_at: '2026-04-02T19:10:00.000Z',
        }),
        normalizeComment({
          id: `reply-${trackId}-2`,
          parent_comment_id: baseComments[0].id,
          user: trackExperienceMockData.viewer,
          text: 'That transition is the part I kept replaying.',
          created_at: '2026-04-02T20:05:00.000Z',
        }),
      ],
      [baseComments[1].id]: [
        normalizeComment({
          id: `reply-${trackId}-3`,
          parent_comment_id: baseComments[1].id,
          user: commentUsers[0],
          text: 'The stereo spread is doing a lot of work there.',
          created_at: '2026-04-03T11:25:00.000Z',
        }),
      ],
    },
    likers: sliceUsers((pivot + 1) % rotatedUsers.length, 6),
    reposters: sliceUsers((pivot + 4) % rotatedUsers.length, 4),
    fans: sliceUsers((pivot + 2) % rotatedUsers.length, 5).map((user, index) => ({
      ...user,
      plays: 180 - index * 18,
    })),
    relatedTrackIds: allTrackIds.slice(0, 4),
    playlistIds: playlistIds.slice(0, 3),
  }
}

const createMockStore = () => {
  const baseStore = clone(trackExperienceMockData)

  Object.keys(baseStore.tracks).forEach((trackId) => {
    if (!baseStore.engagement[trackId]) {
      baseStore.engagement[trackId] = createFallbackEngagement(
        trackId,
        baseStore.tracks,
        baseStore.playlists,
      )
    }

    if (!baseStore.engagement[trackId].replies) {
      baseStore.engagement[trackId].replies = createSeedRepliesForComments(
        baseStore.engagement[trackId].comments ?? [],
      )
    }

    baseStore.engagement[trackId].comments = (baseStore.engagement[trackId].comments ?? []).map(
      (comment) => ({
        ...comment,
        repliesCount:
          baseStore.engagement[trackId].replies?.[comment.id]?.length ??
          comment.repliesCount ??
          0,
      }),
    )
  })

  return baseStore
}

let mockStore = createMockStore()

const getMockTrackOrThrow = (trackId) => {
  const track = mockStore.tracks[trackId]

  if (!track) {
    throw new Error('Track not found')
  }

  return track
}

const getMockEngagementOrCreate = (trackId) => {
  getMockTrackOrThrow(trackId)

  if (!mockStore.engagement[trackId]) {
    mockStore.engagement[trackId] = createFallbackEngagement(
      trackId,
      mockStore.tracks,
      mockStore.playlists,
    )
  }

  return mockStore.engagement[trackId]
}

const recordMockPlay = (trackId, durationPlayedMs) => {
  const track = getMockTrackOrThrow(trackId)
  const playedAt = formatIsoNow()

  track.playCount += 1

  const historyEntry = createTrackSummary(track, {
    played_at: playedAt,
    duration_played_ms: durationPlayedMs,
  })

  const nextViewerLibrary = updateMockLibraryForViewer((currentViewerLibrary) => ({
    history: [historyEntry, ...(currentViewerLibrary.history ?? [])],
    recentlyPlayed: [
      createTrackSummary(track, {
        played_at: playedAt,
        duration_played_ms: durationPlayedMs,
      }),
      ...(currentViewerLibrary.recentlyPlayed ?? []).filter(
        (item) => item.id !== trackId,
      ),
    ].slice(0, 8),
  }))

  mockStore.history = clone(nextViewerLibrary.history)
  mockStore.recentlyPlayed = clone(nextViewerLibrary.recentlyPlayed)
}

const getMockTrack = (trackId) => {
  const track = getMockTrackOrThrow(trackId)
  getMockEngagementOrCreate(trackId)
  return clone(normalizeTrack(track))
}

const getMockWaveformData = (trackId) => clone(getMockTrackOrThrow(trackId).waveform)

const getMockStreamInfo = (trackId, options = {}) => {
  const track = getMockTrackOrThrow(trackId)
  const playbackContext = String(options.playbackContext ?? '').toLowerCase()
  const isPreviewContext = playbackContext === 'discovery' || playbackContext === 'feed'

  return normalizeStreamInfo({
    url: track.audioUrl,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    access_policy: track.playbackState,
    playback_state: track.playbackState,
    playback_mode: isPreviewContext ? 'preview' : 'full',
    preview_start_seconds: isPreviewContext ? 0 : null,
    preview_duration_seconds: isPreviewContext ? 30 : null,
    message:
      track.playbackState === 'Blocked'
        ? 'This track is blocked for your plan or region.'
        : null,
  })
}

const getMockDownloadInfo = (trackId) => {
  const track = getMockTrackOrThrow(trackId)
  return {
    url: track.audioUrl,
  }
}

const getMockLikers = (trackId) =>
  clone(getMockEngagementOrCreate(trackId).likers.map(normalizeUser))

const getMockReposters = (trackId) =>
  clone(getMockEngagementOrCreate(trackId).reposters.map(normalizeUser))

const getMockComments = (trackId, page = 1, limit = 20) => {
  const engagement = getMockEngagementOrCreate(trackId)
  const items = clone(engagement.comments).map((comment) =>
    normalizeComment({
      ...comment,
      replies_count: engagement.replies?.[comment.id]?.length ?? comment.repliesCount ?? 0,
    }),
  )
  const paginated = paginateItems(items, { page, limit })

  return {
    comments: paginated.items,
    totalCount: items.length,
    pagination: paginated.pagination,
  }
}

const getMockCommentReplies = (commentId, page = 1, limit = 20) => {
  const engagementEntry = Object.values(mockStore.engagement).find((entry) =>
    entry.comments.some((comment) => comment.id === commentId),
  )
  const replies = clone(engagementEntry?.replies?.[commentId] ?? []).map(normalizeComment)
  const paginated = paginateItems(replies, { page, limit })

  return {
    replies: paginated.items,
    totalCount: replies.length,
    pagination: paginated.pagination,
  }
}

const getMockRelatedTracks = (trackId) => {
  const engagement = getMockEngagementOrCreate(trackId)

  return clone(
    engagement.relatedTrackIds
      .map((relatedId) => mockStore.tracks[relatedId])
      .filter(Boolean)
      .map(normalizeTrackCard),
  )
}

const getMockTrackPlaylistsData = (trackId) => {
  const engagement = getMockEngagementOrCreate(trackId)

  return clone(
    engagement.playlistIds
      .map((playlistId) => mockStore.playlists[playlistId])
      .filter(Boolean)
      .map(normalizePlaylist),
  )
}

const getMockFanLeaderboardData = (trackId) =>
  clone(getMockEngagementOrCreate(trackId).fans.map(normalizeFanEntry))

const deleteMockTrack = (trackId) => {
  getMockTrackOrThrow(trackId)

  delete mockStore.tracks[trackId]
  delete mockStore.engagement[trackId]

  Object.values(mockStore.engagement).forEach((entry) => {
    entry.relatedTrackIds = (entry.relatedTrackIds ?? []).filter(
      (relatedTrackId) => relatedTrackId !== trackId,
    )
  })

  const nextLibraryState = readMockLibraryState()

  Object.keys(nextLibraryState).forEach((viewerKey) => {
    nextLibraryState[viewerKey] = {
      recentlyPlayed: (nextLibraryState[viewerKey]?.recentlyPlayed ?? []).filter(
        (item) => item.id !== trackId,
      ),
      history: (nextLibraryState[viewerKey]?.history ?? []).filter(
        (item) => item.id !== trackId,
      ),
    }
  })

  writeMockLibraryState(nextLibraryState)

  const activeViewerLibrary = ensureMockLibraryForViewer()
  mockStore.recentlyPlayed = clone(activeViewerLibrary.recentlyPlayed)
  mockStore.history = clone(activeViewerLibrary.history)

  return { success: true }
}

export const getTrack = async (trackId) => {
  if (useMock) return getMockTrack(trackId)

  return withTrackMockFallback(
    trackId,
    async () => normalizeTrack(await request(`/tracks/${trackId}`)),
    () => getMockTrack(trackId),
  )
}

export const getWaveform = async (trackId) => {
  if (useMock) return getMockWaveformData(trackId)

  return withTrackMockFallback(
    trackId,
    async () => {
      const payload = await request(`/tracks/${trackId}/waveform`)
      return Array.isArray(payload) ? payload : unwrapCollection(payload)
    },
    () => getMockWaveformData(trackId),
  )
}

export const getStreamUrl = async (trackId, options = {}) => {
  if (useMock) return getMockStreamInfo(trackId, options)

  const searchParams = new URLSearchParams()
  if (options.playbackContext) {
    searchParams.set('playbackContext', options.playbackContext)
  }
  const queryString = searchParams.toString()
  const requestPath = queryString
    ? `/tracks/${trackId}/stream-url?${queryString}`
    : `/tracks/${trackId}/stream-url`

  return withTrackMockFallback(
    trackId,
    async () => normalizeStreamInfo(await request(requestPath)),
    () => getMockStreamInfo(trackId, options),
  )
}

export const getDownloadUrl = async (trackId) => {
  if (useMock) return getMockDownloadInfo(trackId)

  return withTrackMockFallback(
    trackId,
    async () => request(`/tracks/${trackId}/download`),
    () => getMockDownloadInfo(trackId),
  )
}

export const registerPlay = async (trackId, payload) => {
  if (useMock) {
    getMockTrackOrThrow(trackId)
    recordMockPlay(trackId, payload.duration_played_ms)
    return { success: true }
  }

  return withTrackMockFallback(
    trackId,
    async () =>
      request(`/tracks/${trackId}/play`, {
        method: 'POST',
        body: payload,
      }),
    () => {
      getMockTrackOrThrow(trackId)
      recordMockPlay(trackId, payload.duration_played_ms)
      return { success: true }
    },
  )
}

export const getRecentlyPlayed = async () => {
  if (useMock) {
    return getMockRecentlyPlayedEntries().map(normalizeHistoryEntry)
  }

  return withMockFallback(
    async () =>
      dedupeHistoryEntriesByTrack(
        normalizeHistoryCollection(await request('/users/me/recently-played')),
      ),
    () => getMockRecentlyPlayedEntries().map(normalizeHistoryEntry),
  )
}

export const getListeningHistory = async () => {
  if (useMock) {
    return getMockHistoryEntries().map(normalizeHistoryEntry)
  }

  return withMockFallback(
    async () => normalizeHistoryCollection(await request('/users/me/history')),
    () => getMockHistoryEntries().map(normalizeHistoryEntry),
  )
}

export const clearListeningHistory = async () => {
  const clearMockHistory = () => {
    const nextViewerLibrary = updateMockLibraryForViewer(() => ({
      history: [],
      recentlyPlayed: [],
    }))

    mockStore.history = clone(nextViewerLibrary.history)
    mockStore.recentlyPlayed = clone(nextViewerLibrary.recentlyPlayed)
    return { success: true }
  }

  if (useMock) {
    return clearMockHistory()
  }

  const candidatePaths = ['/users/me/history', '/history']
  let lastError = null

  for (const path of candidatePaths) {
    try {
      const response = await request(path, { method: 'DELETE' })
      return response ?? { success: true }
    } catch (error) {
      lastError = error

      if (error?.status !== 404) {
        if (shouldUseMockFallback(error)) {
          console.warn('Falling back to clearing mock history.', error)
          return clearMockHistory()
        }

        throw error
      }
    }
  }

  if (shouldUseMockFallback(lastError)) {
    console.warn('Falling back to clearing mock history.', lastError)
    return clearMockHistory()
  }

  throw lastError ?? new Error('Could not clear listening history.')
}

export const deleteTrack = async (trackId) => {
  if (useMock) {
    return deleteMockTrack(trackId)
  }

  return withTrackMockFallback(
    trackId,
    async () =>
      request(`/tracks/${trackId}`, {
        method: 'DELETE',
      }),
    () => deleteMockTrack(trackId),
  )
}

export const toggleLike = async (targetId, shouldLike, targetType = 'tracks') => {
  const resource = normalizeTargetResource(targetType)
  const isTrackResource = resource === 'tracks'

  if (useMock && isTrackResource) {
    const track = getMockTrackOrThrow(targetId)
    const engagement = getMockEngagementOrCreate(targetId)

    if (shouldLike) {
      track.viewerHasLiked = true
      if (!engagement.likers.some((user) => user.id === mockStore.viewer.id)) {
        engagement.likers = [clone(mockStore.viewer), ...engagement.likers]
      }
    } else {
      track.viewerHasLiked = false
      engagement.likers = engagement.likers.filter(
        (user) => user.id !== mockStore.viewer.id,
      )
    }

    track.likeCount = Math.max(track.likeCount + (shouldLike ? 1 : -1), 0)
    return { success: true }
  }

  const method = shouldLike ? 'POST' : 'DELETE'

  if (!isTrackResource) {
    return request(`/${resource}/${targetId}/like`, { method })
  }

  return withTrackMockFallback(
    targetId,
    async () => request(`/${resource}/${targetId}/like`, { method }),
    () => {
      const track = getMockTrackOrThrow(targetId)
      const engagement = getMockEngagementOrCreate(targetId)

      if (shouldLike) {
        track.viewerHasLiked = true
        if (!engagement.likers.some((user) => user.id === mockStore.viewer.id)) {
          engagement.likers = [clone(mockStore.viewer), ...engagement.likers]
        }
      } else {
        track.viewerHasLiked = false
        engagement.likers = engagement.likers.filter(
          (user) => user.id !== mockStore.viewer.id,
        )
      }

      track.likeCount = Math.max(track.likeCount + (shouldLike ? 1 : -1), 0)
      return { success: true }
    },
  )
}

export const getLikers = async (trackId) => {
  if (useMock) return getMockLikers(trackId)

  return withTrackMockFallback(
    trackId,
    async () => unwrapCollection(await request(`/tracks/${trackId}/likers`)).map(normalizeUser),
    () => getMockLikers(trackId),
  )
}

export const toggleRepost = async (targetId, shouldRepost, targetType = 'tracks') => {
  const resource = normalizeTargetResource(targetType)
  const isTrackResource = resource === 'tracks'

  if (useMock && isTrackResource) {
    const track = getMockTrackOrThrow(targetId)
    const engagement = getMockEngagementOrCreate(targetId)

    if (shouldRepost) {
      track.viewerHasReposted = true
      if (!engagement.reposters.some((user) => user.id === mockStore.viewer.id)) {
        engagement.reposters = [clone(mockStore.viewer), ...engagement.reposters]
      }
    } else {
      track.viewerHasReposted = false
      engagement.reposters = engagement.reposters.filter(
        (user) => user.id !== mockStore.viewer.id,
      )
    }

    track.repostCount = Math.max(track.repostCount + (shouldRepost ? 1 : -1), 0)
    return { success: true }
  }

  const method = shouldRepost ? 'POST' : 'DELETE'

  if (!isTrackResource) {
    return request(`/${resource}/${targetId}/repost`, { method })
  }

  return withTrackMockFallback(
    targetId,
    async () => request(`/${resource}/${targetId}/repost`, { method }),
    () => {
      const track = getMockTrackOrThrow(targetId)
      const engagement = getMockEngagementOrCreate(targetId)

      if (shouldRepost) {
        track.viewerHasReposted = true
        if (!engagement.reposters.some((user) => user.id === mockStore.viewer.id)) {
          engagement.reposters = [clone(mockStore.viewer), ...engagement.reposters]
        }
      } else {
        track.viewerHasReposted = false
        engagement.reposters = engagement.reposters.filter(
          (user) => user.id !== mockStore.viewer.id,
        )
      }

      track.repostCount = Math.max(track.repostCount + (shouldRepost ? 1 : -1), 0)
      return { success: true }
    },
  )
}

export const getReposters = async (trackId) => {
  if (useMock) return getMockReposters(trackId)

  return withTrackMockFallback(
    trackId,
    async () =>
      unwrapCollection(await request(`/tracks/${trackId}/reposters`)).map(normalizeUser),
    () => getMockReposters(trackId),
  )
}

export const getViewerLikedTracks = async () => {
  if (useMock) {
    return clone(
      buildTrackListFromIds(
        Object.values(mockStore.tracks)
          .filter((track) => track.viewerHasLiked)
          .map((track) => track.id),
      ),
    )
  }

  return withMockFallback(
    async () => unwrapCollection(await request('/users/me/likes')).map(normalizeTrackCard),
    () =>
      clone(
        buildTrackListFromIds(
          Object.values(mockStore.tracks)
            .filter((track) => track.viewerHasLiked)
            .map((track) => track.id),
        ),
      ),
  )
}

export const getViewerRepostedTracks = async () => {
  if (useMock) {
    return clone(
      buildTrackListFromIds(
        Object.values(mockStore.tracks)
          .filter((track) => track.viewerHasReposted)
          .map((track) => track.id),
      ),
    )
  }

  return withMockFallback(
    async () => unwrapCollection(await request('/users/me/reposts')).map(normalizeTrackCard),
    () =>
      clone(
        buildTrackListFromIds(
          Object.values(mockStore.tracks)
            .filter((track) => track.viewerHasReposted)
            .map((track) => track.id),
        ),
      ),
  )
}

export const getComments = async (trackId, { page = 1, limit = 20, skip } = {}) => {
  const resolvedPage =
    typeof skip === 'number' && skip >= 0 ? Math.floor(skip / Math.max(limit, 1)) + 1 : page

  if (useMock) return getMockComments(trackId, resolvedPage, limit)

  const searchParams = new URLSearchParams({
    page: `${resolvedPage}`,
    limit: `${limit}`,
  })

  return withTrackMockFallback(
    trackId,
    async () => {
      const payload = await request(`/tracks/${trackId}/comments?${searchParams.toString()}`)
      const normalized = normalizePagedComments(payload)

      return {
        comments: normalized.items,
        totalCount: normalized.totalCount,
        pagination: normalized.pagination,
      }
    },
    () => getMockComments(trackId, resolvedPage, limit),
  )
}

export const getCommentReplies = async (commentId, { page = 1, limit = 20, skip } = {}) => {
  const resolvedPage =
    typeof skip === 'number' && skip >= 0 ? Math.floor(skip / Math.max(limit, 1)) + 1 : page

  if (useMock) return getMockCommentReplies(commentId, resolvedPage, limit)

  const searchParams = new URLSearchParams({
    page: `${resolvedPage}`,
    limit: `${limit}`,
  })

  return withMockFallback(
    async () => {
      const payload = await request(`/comments/${commentId}/replies?${searchParams.toString()}`)
      const normalized = normalizePagedComments(payload)

      return {
        replies: normalized.items,
        totalCount: normalized.totalCount,
        pagination: normalized.pagination,
      }
    },
    () => getMockCommentReplies(commentId, resolvedPage, limit),
  )
}

export const createComment = async (trackId, payload) => {
  if (useMock) {
    const engagement = getMockEngagementOrCreate(trackId)

    const comment = normalizeComment({
      id: `comment-${Date.now()}`,
      text: payload.text,
      timestamp_ms: payload.timestamp_ms,
      created_at: formatIsoNow(),
      user: mockStore.viewer,
      parent_comment_id: payload.parentCommentId ?? null,
    })

    if (payload.parentCommentId) {
      engagement.replies = engagement.replies ?? {}
      const nextReplies = [...(engagement.replies[payload.parentCommentId] ?? []), comment]
      engagement.replies[payload.parentCommentId] = nextReplies
      engagement.comments = engagement.comments.map((entry) =>
        entry.id === payload.parentCommentId
          ? {
              ...entry,
              repliesCount: nextReplies.length,
            }
          : entry,
      )
    } else {
      engagement.comments = [...engagement.comments, comment]
    }

    getMockTrackOrThrow(trackId).commentCount += 1
    return clone(comment)
  }

  const requestBody = {
    text: payload.text,
  }

  if (typeof payload.timestamp_ms === 'number') {
    requestBody.timestamp_seconds = Math.floor(payload.timestamp_ms / 1000)
  }

  if (payload.parentCommentId) {
    requestBody.parent_comment_id = payload.parentCommentId
  }

  return withTrackMockFallback(
    trackId,
    async () => {
      const response = await request(`/tracks/${trackId}/comments`, {
        method: 'POST',
        body: requestBody,
      })

      return normalizeComment(response?.comment ?? response)
    },
    () => {
      const engagement = getMockEngagementOrCreate(trackId)

      const comment = normalizeComment({
        id: `comment-${Date.now()}`,
        text: payload.text,
        timestamp_ms: payload.timestamp_ms,
        created_at: formatIsoNow(),
        user: mockStore.viewer,
        parent_comment_id: payload.parentCommentId ?? null,
      })

      if (payload.parentCommentId) {
        engagement.replies = engagement.replies ?? {}
        const nextReplies = [...(engagement.replies[payload.parentCommentId] ?? []), comment]
        engagement.replies[payload.parentCommentId] = nextReplies
        engagement.comments = engagement.comments.map((entry) =>
          entry.id === payload.parentCommentId
            ? {
                ...entry,
                repliesCount: nextReplies.length,
              }
            : entry,
        )
      } else {
        engagement.comments = [...engagement.comments, comment]
      }

      getMockTrackOrThrow(trackId).commentCount += 1
      return clone(comment)
    },
  )
}

export const deleteComment = async (commentId) => {
  if (useMock) {
    Object.values(mockStore.engagement).forEach((entry) => {
      entry.comments = entry.comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              text: 'Comment deleted.',
              isDeleted: true,
            }
          : comment,
      )

      entry.replies = Object.fromEntries(
        Object.entries(entry.replies ?? {}).map(([parentId, replies]) => [
          parentId,
          replies.map((reply) =>
            reply.id === commentId
              ? {
                  ...reply,
                  text: 'Comment deleted.',
                  isDeleted: true,
                }
              : reply,
          ),
        ]),
      )
    })

    return { message: 'Comment deleted successfully.' }
  }

  return withMockFallback(
    async () =>
      request(`/comments/${commentId}`, {
        method: 'DELETE',
      }),
    () => {
      Object.values(mockStore.engagement).forEach((entry) => {
        entry.comments = entry.comments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                text: 'Comment deleted.',
                isDeleted: true,
              }
            : comment,
        )

        entry.replies = Object.fromEntries(
          Object.entries(entry.replies ?? {}).map(([parentId, replies]) => [
            parentId,
            replies.map((reply) =>
              reply.id === commentId
                ? {
                    ...reply,
                    text: 'Comment deleted.',
                    isDeleted: true,
                  }
                : reply,
            ),
          ]),
        )
      })

      return { message: 'Comment deleted successfully.' }
    },
  )
}

export const getRelatedTracks = async (trackId) => {
  if (useMock) return getMockRelatedTracks(trackId)

  return withTrackMockFallback(
    trackId,
    async () => unwrapCollection(await request(`/tracks/${trackId}/related`)).map(normalizeTrackCard),
    () => getMockRelatedTracks(trackId),
  )
}

export const getTrackPlaylists = async (trackId) => {
  if (useMock) return getMockTrackPlaylistsData(trackId)

  return withTrackMockFallback(
    trackId,
    async () =>
      unwrapCollection(await request(`/tracks/${trackId}/playlists`)).map(normalizePlaylist),
    () => getMockTrackPlaylistsData(trackId),
  )
}

export const getFanLeaderboard = async (trackId) => {
  if (useMock) return getMockFanLeaderboardData(trackId)

  return withTrackMockFallback(
    trackId,
    async () => unwrapCollection(await request(`/tracks/${trackId}/fans`)).map(normalizeFanEntry),
    () => getMockFanLeaderboardData(trackId),
  )
}

export const pulsifyAxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

export const toggleAlbumLike = (albumId, shouldLike) =>
  toggleLike(albumId, shouldLike, 'albums')

export const toggleAlbumRepost = (albumId, shouldRepost) =>
  toggleRepost(albumId, shouldRepost, 'albums')

pulsifyAxiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
