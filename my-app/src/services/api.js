import { trackExperienceMockData } from '../mock/trackExperienceData'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const useMock = String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === 'true'
const allowMockFallback =
  String(import.meta.env.VITE_ALLOW_MOCK_FALLBACK ?? 'true').toLowerCase() !== 'false'

const clone = (value) => JSON.parse(JSON.stringify(value))

const formatIsoNow = () => new Date().toISOString()

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

const getAuthToken = () => {
  if (typeof window === 'undefined') return import.meta.env.VITE_AUTH_TOKEN ?? ''

  return (
    window.localStorage.getItem('pulsify_token') ??
    window.localStorage.getItem('accessToken') ??
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
}

export const clearAuthToken = () => {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem('accessToken')
  window.localStorage.removeItem('pulsify_token')
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
    typeLabel: normalizedTrack.typeLabel,
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

const normalizeStreamInfo = (payload = {}) => ({
  url: payload.url ?? '',
  expires_at: payload.expires_at ?? null,
  playback_state: normalizePlaybackState(payload.playback_state),
  preview_duration_seconds: payload.preview_duration_seconds ?? null,
  message: payload.message ?? null,
})

const normalizePagedComments = (payload, fallbackItems = []) => {
  const items = unwrapCollection(payload).map(normalizeComment)
  const totalCount = Number(payload?.comments_count ?? payload?.replies_count ?? payload?.pagination?.total)

  return {
    items,
    totalCount: Number.isFinite(totalCount) ? totalCount : items.length || fallbackItems.length,
    pagination: payload?.pagination ?? null,
  }
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

    const error = new Error(
      payload?.message ?? (typeof payload === 'string' && payload) ?? `Request failed: ${response.status}`,
    )
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

const createFallbackEngagement = (trackId, tracks, playlists) => {
  const allTrackIds = Object.keys(tracks).filter((id) => id !== trackId)
  const playlistIds = Object.keys(playlists)
  const rotatedUsers = seedUsers.filter((user) => user.id !== trackExperienceMockData.viewer.id)
  const pivot = Math.abs(trackId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0))

  const sliceUsers = (start, size) =>
    Array.from({ length: size }, (_, index) => rotatedUsers[(start + index) % rotatedUsers.length])

  const commentUsers = sliceUsers(pivot % rotatedUsers.length, 4)

  return {
    comments: [
      normalizeComment({
        id: `comment-${trackId}-1`,
        user: commentUsers[0],
        text: `This section in ${tracks[trackId].title} really stays with me.`,
        created_at: '2026-04-02T18:00:00.000Z',
        timestamp_ms: 24000,
      }),
      normalizeComment({
        id: `comment-${trackId}-2`,
        user: commentUsers[1],
        text: 'Mix feels crisp and wide all the way through.',
        created_at: '2026-04-03T09:40:00.000Z',
        timestamp_ms: 89000,
      }),
      normalizeComment({
        id: `comment-${trackId}-3`,
        user: commentUsers[2],
        text: 'Would absolutely repost this.',
        created_at: '2026-04-03T20:15:00.000Z',
      }),
    ],
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

  mockStore.history = [historyEntry, ...mockStore.history].slice(0, 8)
  mockStore.recentlyPlayed = [
    createTrackSummary(track, { played_at: playedAt }),
    ...mockStore.recentlyPlayed.filter((item) => item.id !== trackId),
  ].slice(0, 5)
}

const getMockTrack = (trackId) => {
  const track = getMockTrackOrThrow(trackId)
  getMockEngagementOrCreate(trackId)
  return clone(normalizeTrack(track))
}

const getMockWaveformData = (trackId) => clone(getMockTrackOrThrow(trackId).waveform)

const getMockStreamInfo = (trackId) => {
  const track = getMockTrackOrThrow(trackId)
  return normalizeStreamInfo({
    url: track.audioUrl,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    playback_state: track.playbackState,
    preview_duration_seconds: track.previewDurationSeconds,
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

const getMockComments = (trackId, limit = 20) => {
  const items = clone(getMockEngagementOrCreate(trackId).comments).map(normalizeComment)
  return {
    comments: items,
    totalCount: items.length,
    pagination: {
      page: 1,
      limit,
      total: items.length,
      pages: Math.ceil(items.length / Math.max(limit, 1)),
    },
  }
}

const getMockCommentReplies = (limit = 20) => ({
  replies: [],
  totalCount: 0,
  pagination: {
    page: 1,
    limit,
    total: 0,
    pages: 0,
  },
})

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

export const getTrack = async (trackId) => {
  if (useMock) return getMockTrack(trackId)

  return withMockFallback(
    async () => normalizeTrack(await request(`/tracks/${trackId}`)),
    () => getMockTrack(trackId),
  )
}

export const getWaveform = async (trackId) => {
  if (useMock) return getMockWaveformData(trackId)

  return withMockFallback(
    async () => {
      const payload = await request(`/tracks/${trackId}/waveform`)
      return Array.isArray(payload) ? payload : unwrapCollection(payload)
    },
    () => getMockWaveformData(trackId),
  )
}

export const getStreamUrl = async (trackId) => {
  if (useMock) return getMockStreamInfo(trackId)

  return withMockFallback(
    async () => normalizeStreamInfo(await request(`/tracks/${trackId}/stream-url`)),
    () => getMockStreamInfo(trackId),
  )
}

export const getDownloadUrl = async (trackId) => {
  if (useMock) return getMockDownloadInfo(trackId)

  return withMockFallback(
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

  return withMockFallback(
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
    return clone(mockStore.recentlyPlayed)
  }

  return withMockFallback(
    async () => unwrapCollection(await request('/users/me/recently-played')),
    () => clone(mockStore.recentlyPlayed),
  )
}

export const getListeningHistory = async () => {
  if (useMock) {
    return clone(mockStore.history)
  }

  return withMockFallback(
    async () => unwrapCollection(await request('/users/me/history')),
    () => clone(mockStore.history),
  )
}

export const toggleLike = async (trackId, shouldLike) => {
  if (useMock) {
    const track = getMockTrackOrThrow(trackId)
    const engagement = getMockEngagementOrCreate(trackId)

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
  return withMockFallback(
    async () => request(`/tracks/${trackId}/like`, { method }),
    () => {
      const track = getMockTrackOrThrow(trackId)
      const engagement = getMockEngagementOrCreate(trackId)

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

  return withMockFallback(
    async () => unwrapCollection(await request(`/tracks/${trackId}/likers`)).map(normalizeUser),
    () => getMockLikers(trackId),
  )
}

export const toggleRepost = async (trackId, shouldRepost) => {
  if (useMock) {
    const track = getMockTrackOrThrow(trackId)
    const engagement = getMockEngagementOrCreate(trackId)

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
  return withMockFallback(
    async () => request(`/tracks/${trackId}/repost`, { method }),
    () => {
      const track = getMockTrackOrThrow(trackId)
      const engagement = getMockEngagementOrCreate(trackId)

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

  return withMockFallback(
    async () =>
      unwrapCollection(await request(`/tracks/${trackId}/reposters`)).map(normalizeUser),
    () => getMockReposters(trackId),
  )
}

export const getComments = async (trackId, { skip = 0, limit = 20 } = {}) => {
  if (useMock) return getMockComments(trackId, limit)

  const searchParams = new URLSearchParams({
    skip: `${skip}`,
    limit: `${limit}`,
  })
  return withMockFallback(
    async () => {
      const payload = await request(`/tracks/${trackId}/comments?${searchParams.toString()}`)
      const normalized = normalizePagedComments(payload)

      return {
        comments: normalized.items,
        totalCount: normalized.totalCount,
        pagination: normalized.pagination,
      }
    },
    () => getMockComments(trackId, limit),
  )
}

export const getCommentReplies = async (commentId, { skip = 0, limit = 20 } = {}) => {
  if (useMock) return getMockCommentReplies(limit)

  const searchParams = new URLSearchParams({
    skip: `${skip}`,
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
    () => getMockCommentReplies(limit),
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
    })

    engagement.comments = [...engagement.comments, comment]
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

  return withMockFallback(
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
      })

      engagement.comments = [...engagement.comments, comment]
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
      })

      return { message: 'Comment deleted successfully.' }
    },
  )
}

export const getRelatedTracks = async (trackId) => {
  if (useMock) return getMockRelatedTracks(trackId)

  return withMockFallback(
    async () => unwrapCollection(await request(`/tracks/${trackId}/related`)).map(normalizeTrackCard),
    () => getMockRelatedTracks(trackId),
  )
}

export const getTrackPlaylists = async (trackId) => {
  if (useMock) return getMockTrackPlaylistsData(trackId)

  return withMockFallback(
    async () =>
      unwrapCollection(await request(`/tracks/${trackId}/playlists`)).map(normalizePlaylist),
    () => getMockTrackPlaylistsData(trackId),
  )
}

export const getFanLeaderboard = async (trackId) => {
  if (useMock) return getMockFanLeaderboardData(trackId)

  return withMockFallback(
    async () => unwrapCollection(await request(`/tracks/${trackId}/fans`)).map(normalizeFanEntry),
    () => getMockFanLeaderboardData(trackId),
  )
}
