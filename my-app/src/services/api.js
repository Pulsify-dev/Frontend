import mockData from '../mock/track.json'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''
const useMock = String(import.meta.env.VITE_USE_MOCKS).toLowerCase() === 'true'

const viewerUser = {
  id: 'usr-viewer',
  name: 'You',
  handle: '@you',
  avatar:
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
}

const clone = (value) => JSON.parse(JSON.stringify(value))

const formatIsoNow = () => new Date().toISOString()

const normalizeUser = (user = {}) => ({
  id: user.id ?? `user-${Math.random().toString(16).slice(2, 10)}`,
  name: user.name ?? user.username ?? 'Unknown listener',
  handle: user.handle ?? (user.username ? `@${user.username}` : '@listener'),
  avatar:
    user.avatar ??
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
})

const normalizeComment = (comment = {}) => ({
  id: comment.id ?? `comment-${Math.random().toString(16).slice(2, 10)}`,
  text: comment.text ?? '',
  timestamp_ms:
    comment.timestamp_ms ??
    (typeof comment.time === 'number' ? Math.round(comment.time * 1000) : null),
  created_at: comment.created_at ?? formatIsoNow(),
  user: normalizeUser(comment.user),
})

const normalizeTrack = (track = {}) => ({
  id: track.id ?? 'trk-2026-014',
  title: track.title ?? 'Untitled track',
  artist: track.artist ?? 'Unknown artist',
  artistHandle: track.artistHandle ?? '@artist',
  artistAvatar: track.artistAvatar ?? track.cover ?? '',
  cover: track.cover ?? '',
  audioUrl: track.audioUrl ?? '',
  duration: track.duration ?? 0,
  description: track.description ?? '',
  genre: track.genre ?? 'Electronic',
  location: track.location ?? 'Cairo, Egypt',
  postedAt: track.postedAt ?? formatIsoNow(),
  playCount: track.playCount ?? track.plays ?? 0,
  likeCount: track.likeCount ?? track.likes ?? 0,
  repostCount: track.repostCount ?? track.reposts ?? 0,
  commentCount:
    track.commentCount ??
    track.commentsCount ??
    (Array.isArray(track.comments) ? track.comments.length : 0),
  viewerHasLiked: Boolean(track.viewerHasLiked),
  viewerHasReposted: Boolean(track.viewerHasReposted),
  playbackState: track.playbackState ?? 'Playable',
  previewDurationSeconds: track.previewDurationSeconds ?? 0,
  waveform: Array.isArray(track.waveform) ? track.waveform : [],
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
  return []
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

const createMockStore = () => {
  const baseTrack = normalizeTrack(mockData.track)

  return {
    viewer: clone(viewerUser),
    track: baseTrack,
    comments: (mockData.comments ?? mockData.track.comments ?? []).map(normalizeComment),
    likers: (mockData.likers ?? []).map(normalizeUser),
    reposters: (mockData.reposters ?? []).map(normalizeUser),
    recentlyPlayed: clone(mockData.recentlyPlayed ?? []),
    history: clone(mockData.history ?? []),
  }
}

let mockStore = createMockStore()

const getAuthToken = () => {
  if (typeof window === 'undefined') return import.meta.env.VITE_AUTH_TOKEN ?? ''
  return (
    window.localStorage.getItem('pulsify_token') ??
    import.meta.env.VITE_AUTH_TOKEN ??
    ''
  )
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
    throw new Error(`Request failed: ${response.status}`)
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

const syncDerivedCounts = () => {
  mockStore.track.likeCount = mockStore.likers.length
  mockStore.track.repostCount = mockStore.reposters.length
  mockStore.track.commentCount = mockStore.comments.length
}

const recordMockPlay = (durationPlayedMs) => {
  const playedAt = formatIsoNow()
  mockStore.track.playCount += 1

  const historyEntry = createTrackSummary(mockStore.track, {
    played_at: playedAt,
    duration_played_ms: durationPlayedMs,
  })

  mockStore.history = [historyEntry, ...mockStore.history].slice(0, 8)

  const nextRecent = [
    createTrackSummary(mockStore.track, { played_at: playedAt }),
    ...mockStore.recentlyPlayed.filter((item) => item.id !== mockStore.track.id),
  ]

  mockStore.recentlyPlayed = nextRecent.slice(0, 5)
}

export const getTrack = async (trackId) => {
  if (useMock) {
    if (trackId && trackId !== mockStore.track.id) {
      throw new Error('Track not found')
    }

    syncDerivedCounts()
    return clone(mockStore.track)
  }

  const payload = await request(`/tracks/${trackId}`)
  return normalizeTrack(payload)
}

export const getWaveform = async (trackId) => {
  if (useMock) {
    if (trackId && trackId !== mockStore.track.id) {
      throw new Error('Track not found')
    }

    return clone(mockStore.track.waveform)
  }

  const payload = await request(`/tracks/${trackId}/waveform`, { auth: false })
  return Array.isArray(payload) ? payload : unwrapCollection(payload)
}

export const getStreamUrl = async (trackId) => {
  if (useMock) {
    if (trackId && trackId !== mockStore.track.id) {
      throw new Error('Track not found')
    }

    return {
      url: mockStore.track.audioUrl,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      playback_state: mockStore.track.playbackState,
      preview_duration_seconds: mockStore.track.previewDurationSeconds,
      message:
        mockStore.track.playbackState === 'Blocked'
          ? 'This track is blocked for your plan or region.'
          : null,
    }
  }

  return request(`/tracks/${trackId}/stream-url`)
}

export const registerPlay = async (trackId, payload) => {
  if (useMock) {
    if (trackId && trackId !== mockStore.track.id) {
      throw new Error('Track not found')
    }

    recordMockPlay(payload.duration_played_ms)
    return { success: true }
  }

  return request(`/tracks/${trackId}/play`, {
    method: 'POST',
    body: payload,
  })
}

export const getRecentlyPlayed = async () => {
  if (useMock) {
    return clone(mockStore.recentlyPlayed)
  }

  const payload = await request('/users/me/recently-played')
  return unwrapCollection(payload)
}

export const getListeningHistory = async () => {
  if (useMock) {
    return clone(mockStore.history)
  }

  const payload = await request('/users/me/history')
  return unwrapCollection(payload)
}

export const toggleLike = async (trackId, shouldLike) => {
  if (useMock) {
    if (trackId && trackId !== mockStore.track.id) {
      throw new Error('Track not found')
    }

    if (shouldLike) {
      mockStore.track.viewerHasLiked = true
      if (!mockStore.likers.some((user) => user.id === mockStore.viewer.id)) {
        mockStore.likers = [clone(mockStore.viewer), ...mockStore.likers]
      }
    } else {
      mockStore.track.viewerHasLiked = false
      mockStore.likers = mockStore.likers.filter((user) => user.id !== mockStore.viewer.id)
    }

    syncDerivedCounts()
    return { success: true }
  }

  const method = shouldLike ? 'POST' : 'DELETE'
  return request(`/tracks/${trackId}/like`, { method })
}

export const getLikers = async (trackId) => {
  if (useMock) {
    return clone(mockStore.likers)
  }

  const payload = await request(`/tracks/${trackId}/likers`, { auth: false })
  return unwrapCollection(payload).map(normalizeUser)
}

export const toggleRepost = async (trackId, shouldRepost) => {
  if (useMock) {
    if (trackId && trackId !== mockStore.track.id) {
      throw new Error('Track not found')
    }

    if (shouldRepost) {
      mockStore.track.viewerHasReposted = true
      if (!mockStore.reposters.some((user) => user.id === mockStore.viewer.id)) {
        mockStore.reposters = [clone(mockStore.viewer), ...mockStore.reposters]
      }
    } else {
      mockStore.track.viewerHasReposted = false
      mockStore.reposters = mockStore.reposters.filter(
        (user) => user.id !== mockStore.viewer.id,
      )
    }

    syncDerivedCounts()
    return { success: true }
  }

  const method = shouldRepost ? 'POST' : 'DELETE'
  return request(`/tracks/${trackId}/repost`, { method })
}

export const getReposters = async (trackId) => {
  if (useMock) {
    return clone(mockStore.reposters)
  }

  const payload = await request(`/tracks/${trackId}/reposters`, { auth: false })
  return unwrapCollection(payload).map(normalizeUser)
}

export const getComments = async (trackId) => {
  if (useMock) {
    if (trackId && trackId !== mockStore.track.id) {
      throw new Error('Track not found')
    }

    return clone(mockStore.comments).sort((left, right) => {
      const leftTime = left.timestamp_ms ?? Number.MAX_SAFE_INTEGER
      const rightTime = right.timestamp_ms ?? Number.MAX_SAFE_INTEGER
      return leftTime - rightTime
    })
  }

  const payload = await request(`/tracks/${trackId}/comments`, { auth: false })
  return unwrapCollection(payload).map(normalizeComment)
}

export const createComment = async (trackId, payload) => {
  if (useMock) {
    if (trackId && trackId !== mockStore.track.id) {
      throw new Error('Track not found')
    }

    const comment = normalizeComment({
      id: `comment-${Date.now()}`,
      text: payload.text,
      timestamp_ms: payload.timestamp_ms,
      created_at: formatIsoNow(),
      user: mockStore.viewer,
    })

    mockStore.comments = [...mockStore.comments, comment]
    syncDerivedCounts()
    return clone(comment)
  }

  const response = await request(`/tracks/${trackId}/comments`, {
    method: 'POST',
    body: payload,
  })

  return normalizeComment(response)
}
