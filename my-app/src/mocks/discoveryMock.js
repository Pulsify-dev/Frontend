import { trackExperienceMockData } from '../mock/trackExperienceData'

const baseFeedData = ['trk-2026-014', 'trk-2026-011', 'trk-2026-009'].map((trackId, index) => {
  const track = trackExperienceMockData.tracks[trackId]

  return {
    trackId: track.id,
    title: track.title,
    artist: {
      id: `${track.id}-artist`,
      name: track.artist,
      avatarUrl: track.artistAvatar,
    },
    plays: track.playCount,
    likes: track.likeCount,
    reposts: track.repostCount,
    coverArt: track.cover,
    audioUrl: track.audioUrl,
    playbackState: track.playbackState,
    previewDurationSeconds: track.previewDurationSeconds,
    durationSeconds: track.duration,
    uploadedAt: ['2 hours ago', '5 hours ago', '1 day ago'][index] ?? 'Recently',
  }
})

export const mockFeedData = baseFeedData

export const mockTrendingData = [
  { rank: 1, ...mockFeedData[1] },
  { rank: 2, ...mockFeedData[0] },
  { rank: 3, ...mockFeedData[2] },
]

export const fetchFeed = async () =>
  new Promise((resolve) => {
    setTimeout(() => resolve(mockFeedData), 600)
  })

export const fetchTrending = async () =>
  new Promise((resolve) => setTimeout(() => resolve(mockTrendingData), 450))

export const searchTracks = async (term) =>
  new Promise((resolve) => {
    setTimeout(() => {
      if (!term.trim()) return resolve([])

      const lowerTerm = term.toLowerCase()
      const results = [...mockFeedData, ...mockTrendingData].filter(
        (track) =>
          track.title.toLowerCase().includes(lowerTerm) ||
          track.artist.name.toLowerCase().includes(lowerTerm),
      )

      resolve(
        Array.from(new Map(results.map((item) => [item.trackId, item])).values()),
      )
    }, 400)
  })

export const likeTrack = async (trackId) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, trackId, action: 'liked' })
    }, 200)
  })

export const repostTrack = async (trackId) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, trackId, action: 'reposted' })
    }, 200)
  })

export const recordPlay = async (trackId) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, trackId, action: 'played' })
    }, 200)
  })

export const resolveUrl = async (permalink) =>
  new Promise((resolve) => {
    setTimeout(() => {
      const match = mockFeedData.find(
        (track) =>
          permalink.includes(track.trackId) ||
          permalink.includes(track.title.toLowerCase().replace(/\s+/g, '-')),
      )

      if (match) {
        resolve({ type: 'track', id: match.trackId, data: match, resolved: true })
        return
      }

      resolve({ type: 'unknown', id: null, resolved: false })
    }, 200)
  })
