import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Comments from '../components/Comments'
import EngagementListModal from '../components/EngagementListModal'
import HistoryPanel from '../components/HistoryPanel'
import LoadingState from '../components/LoadingState'
import PlayerCard from '../components/PlayerCard'
import PlayerDock from '../components/PlayerDock'
import TrackHeader from '../components/TrackHeader'
import { trackExperienceMockData } from '../mock/trackExperienceData'
import {
  clearAuthToken,
  createComment,
  deleteComment,
  getDownloadUrl,
  getCommentReplies,
  getComments,
  getFanLeaderboard,
  hasAuthToken,
  getLikers,
  getRelatedTracks,
  getReposters,
  readAuthToken,
  saveAuthToken,
  getStreamUrl,
  getTrack,
  getTrackPlaylists,
  registerPlay,
  toggleLike,
  toggleRepost,
} from '../services/api'
import '../App.css'

const DEFAULT_TRACK_ID = import.meta.env.VITE_TRACK_ID ?? 'trk-2026-014'
const mockTrackOrder = Object.keys(trackExperienceMockData.tracks)

const buildTrackPath = (targetTrackId, view) => {
  if (view === 'overview') {
    return `/tracks/${targetTrackId}`
  }

  return `/tracks/${targetTrackId}/${view}`
}

const sanitizeFilenamePart = (value) =>
  String(value ?? '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const inferDownloadExtension = (url, mimeType) => {
  if (mimeType?.includes('mpeg')) return 'mp3'
  if (mimeType?.includes('wav')) return 'wav'
  if (mimeType?.includes('ogg')) return 'ogg'
  if (mimeType?.includes('aac')) return 'aac'
  if (mimeType?.includes('mp4')) return 'm4a'

  try {
    const pathname = new URL(url).pathname
    const match = pathname.match(/\.([a-z0-9]{2,5})$/i)
    return match?.[1]?.toLowerCase() ?? 'mp3'
  } catch {
    return 'mp3'
  }
}

const sortCommentsByTimeline = (items) =>
  [...items].sort((left, right) => {
    const leftTime = left.timestamp_ms ?? Number.MAX_SAFE_INTEGER
    const rightTime = right.timestamp_ms ?? Number.MAX_SAFE_INTEGER
    return leftTime - rightTime
  })

const markCommentAsDeleted = (comment) => ({
  ...comment,
  text: 'Comment deleted.',
  isDeleted: true,
})

const getSectionConfig = (view, track, relatedTracks, playlists, likers, reposters) => {
  if (!track) return null

  if (view === 'related') {
    return {
      title: 'Related tracks',
      description: `Tracks that sit naturally next to ${track.title}.`,
      variant: 'tracks',
      items: relatedTracks,
    }
  }

  if (view === 'playlists') {
    return {
      title: 'In playlists',
      description: 'Curated playlists where this track already appears.',
      variant: 'playlists',
      items: playlists,
    }
  }

  if (view === 'likes') {
    return {
      title: 'Likes',
      description: 'Listeners who favorited this track.',
      variant: 'users',
      items: likers,
    }
  }

  if (view === 'reposts') {
    return {
      title: 'Reposts',
      description: 'Listeners who pushed this track into their feed.',
      variant: 'users',
      items: reposters,
    }
  }

  return null
}

function TrackPage({ view = 'overview' }) {
  const navigate = useNavigate()
  const { trackId: routeTrackId } = useParams()
  const trackId = routeTrackId ?? DEFAULT_TRACK_ID
  const audioRef = useRef(null)
  const sessionReportedRef = useRef(false)

  const [authRefreshKey, setAuthRefreshKey] = useState(0)
  const [tokenInput, setTokenInput] = useState(() => readAuthToken())
  const [track, setTrack] = useState(null)
  const [streamInfo, setStreamInfo] = useState(null)
  const [comments, setComments] = useState([])
  const [commentTotal, setCommentTotal] = useState(0)
  const [relatedTracks, setRelatedTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [fanLeaderboard, setFanLeaderboard] = useState([])
  const [likers, setLikers] = useState([])
  const [reposters, setReposters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(70)
  const [playerMessage, setPlayerMessage] = useState('')

  const playbackState = streamInfo?.playback_state ?? track?.playbackState ?? 'Playable'
  const previewDurationSeconds =
    streamInfo?.preview_duration_seconds ?? track?.previewDurationSeconds ?? 0

  const visibleComments = useMemo(
    () => (view === 'overview' ? comments.slice(0, 6) : comments),
    [comments, view],
  )

  const sectionConfig = useMemo(
    () => getSectionConfig(view, track, relatedTracks, playlists, likers, reposters),
    [view, track, relatedTracks, playlists, likers, reposters],
  )

  const currentTrackIndex = useMemo(() => mockTrackOrder.indexOf(trackId), [trackId])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume / 100
  }, [volume])

  const isAuthError =
    error.startsWith('Missing access token.') || error.startsWith('Unauthorized.')

  useEffect(() => {
    let isMounted = true

    const loadTrack = async () => {
      setIsLoading(true)
      setError('')
      setPlayerMessage(
        hasAuthToken()
          ? ''
          : 'Demo mode active. Add a backend token any time to use live data.',
      )
      setCurrentTime(0)
      setIsPlaying(false)
      setCommentTotal(0)
      sessionReportedRef.current = false

      if (!isMounted) return

      let nextTrack = null

      try {
        nextTrack = await getTrack(trackId)
      } catch (trackError) {
        setError('Track unavailable right now.')
        setIsLoading(false)
        return
      }

      const results = await Promise.allSettled([
        getStreamUrl(trackId),
        getComments(trackId),
        getLikers(trackId),
        getReposters(trackId),
        getRelatedTracks(trackId),
        getTrackPlaylists(trackId),
        getFanLeaderboard(trackId),
      ])

      if (!isMounted) return

      setTrack(nextTrack)
      setDuration(nextTrack.duration ?? 0)
      setStreamInfo(
        results[0].status === 'fulfilled'
          ? results[0].value
          : results[0].reason?.status === 403
            ? {
                url: '',
                playback_state: 'Blocked',
                preview_duration_seconds: 0,
                message:
                  results[0].reason?.message ??
                  'This track is blocked for your plan or region.',
              }
            : {
                url: nextTrack.audioUrl,
                playback_state: nextTrack.playbackState,
                preview_duration_seconds: nextTrack.previewDurationSeconds,
              },
      )
      const commentsPayload =
        results[1].status === 'fulfilled'
          ? results[1].value
          : { comments: [], totalCount: nextTrack.commentCount ?? 0 }
      setComments(sortCommentsByTimeline(commentsPayload.comments))
      setCommentTotal(commentsPayload.totalCount ?? nextTrack.commentCount ?? 0)
      setLikers(results[2].status === 'fulfilled' ? results[2].value : [])
      setReposters(results[3].status === 'fulfilled' ? results[3].value : [])
      setRelatedTracks(results[4].status === 'fulfilled' ? results[4].value : [])
      setPlaylists(results[5].status === 'fulfilled' ? results[5].value : [])
      setFanLeaderboard(results[6].status === 'fulfilled' ? results[6].value : [])
      setIsLoading(false)
    }

    loadTrack()

    return () => {
      isMounted = false
    }
  }, [authRefreshKey, trackId])

  const handleTokenSubmit = (event) => {
    event.preventDefault()

    const normalizedToken = tokenInput.trim()
    if (!normalizedToken) {
      setError('Enter a token first.')
      return
    }

    saveAuthToken(normalizedToken)
    setError('')
    setAuthRefreshKey((currentValue) => currentValue + 1)
  }

  const handleClearToken = () => {
    clearAuthToken()
    setTokenInput('')
    setTrack(null)
    setStreamInfo(null)
    setComments([])
    setCommentTotal(0)
    setRelatedTracks([])
    setPlaylists([])
    setFanLeaderboard([])
    setLikers([])
    setReposters([])
    setError(
      'Missing access token. Add a valid token in localStorage as `accessToken` or `pulsify_token`, then reload.',
    )
  }

  const submitPlayEvent = async () => {
    const playedMs = Math.round((audioRef.current?.currentTime ?? currentTime) * 1000)

    if (!track || playedMs < 5000 || sessionReportedRef.current) {
      return
    }

    sessionReportedRef.current = true

    try {
      await registerPlay(track.id, { duration_played_ms: playedMs })
      setTrack((currentTrack) =>
        currentTrack
          ? {
              ...currentTrack,
              playCount: currentTrack.playCount + 1,
            }
          : currentTrack,
      )
    } catch (registerError) {
      sessionReportedRef.current = false
      console.error(registerError)
    }
  }

  const handleSeek = (nextValue) => {
    if (!audioRef.current) return

    if (playbackState === 'Blocked') {
      setPlayerMessage('Playback is blocked for this account or region.')
      return
    }

    const targetTime =
      playbackState === 'Preview' && previewDurationSeconds
        ? Math.min(nextValue, previewDurationSeconds)
        : nextValue

    audioRef.current.currentTime = targetTime
    setCurrentTime(targetTime)
  }

  const handleTogglePlay = async () => {
    if (!audioRef.current || !track) return

    if (playbackState === 'Blocked') {
      setPlayerMessage('This track is blocked because of plan or region rules.')
      return
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      await submitPlayEvent()
      return
    }

    if (
      playbackState === 'Preview' &&
      previewDurationSeconds &&
      currentTime >= previewDurationSeconds
    ) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
    }

    try {
      await audioRef.current.play()
      setIsPlaying(true)
      setPlayerMessage(
        playbackState === 'Preview'
          ? `Preview access active for ${previewDurationSeconds} seconds.`
          : '',
      )
    } catch (playError) {
      setPlayerMessage('Audio playback could not start.')
      console.error(playError)
    }
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return

    const nextTime = audioRef.current.currentTime

    if (
      playbackState === 'Preview' &&
      previewDurationSeconds &&
      nextTime >= previewDurationSeconds
    ) {
      audioRef.current.currentTime = previewDurationSeconds
      audioRef.current.pause()
      setCurrentTime(previewDurationSeconds)
      setIsPlaying(false)
      setPlayerMessage(`Preview ended at ${Math.floor(previewDurationSeconds)} seconds.`)
      return
    }

    setCurrentTime(nextTime)
  }

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return

    if (!Number.isNaN(audioRef.current.duration)) {
      setDuration(Math.floor(audioRef.current.duration))
    }
  }

  const handlePause = async () => {
    setIsPlaying(false)
    await submitPlayEvent()
  }

  const handleEnded = async () => {
    setIsPlaying(false)
    await submitPlayEvent()
  }

  const handleLikeToggle = async () => {
    if (!track) return

    const shouldLike = !track.viewerHasLiked

    setTrack((currentTrack) => ({
      ...currentTrack,
      viewerHasLiked: shouldLike,
      likeCount: Math.max(currentTrack.likeCount + (shouldLike ? 1 : -1), 0),
    }))

    try {
      await toggleLike(track.id, shouldLike)
      setLikers(await getLikers(track.id))
    } catch (toggleError) {
      setTrack((currentTrack) => ({
        ...currentTrack,
        viewerHasLiked: !shouldLike,
        likeCount: Math.max(currentTrack.likeCount + (shouldLike ? -1 : 1), 0),
      }))
      console.error(toggleError)
    }
  }

  const handleRepostToggle = async () => {
    if (!track) return

    const shouldRepost = !track.viewerHasReposted

    setTrack((currentTrack) => ({
      ...currentTrack,
      viewerHasReposted: shouldRepost,
      repostCount: Math.max(currentTrack.repostCount + (shouldRepost ? 1 : -1), 0),
    }))

    try {
      await toggleRepost(track.id, shouldRepost)
      setReposters(await getReposters(track.id))
    } catch (toggleError) {
      setTrack((currentTrack) => ({
        ...currentTrack,
        viewerHasReposted: !shouldRepost,
        repostCount: Math.max(currentTrack.repostCount + (shouldRepost ? -1 : 1), 0),
      }))
      console.error(toggleError)
    }
  }

  const handleAddComment = async (payload) => {
    if (!track) return

    const comment = await createComment(track.id, payload)
    setComments((currentComments) => sortCommentsByTimeline([...currentComments, comment]))
    setCommentTotal((currentTotal) => currentTotal + 1)
    setTrack((currentTrack) => ({
      ...currentTrack,
      commentCount: currentTrack.commentCount + 1,
    }))
  }

  const handleLoadReplies = async (commentId) => {
    const response = await getCommentReplies(commentId)
    return response.replies
  }

  const handleDeleteComment = async (commentId) => {
    await deleteComment(commentId)
    setComments((currentComments) =>
      currentComments.map((comment) =>
        comment.id === commentId ? markCommentAsDeleted(comment) : comment,
      ),
    )
    setPlayerMessage('Comment deleted successfully.')
  }

  const copyShareLink = async (url, successMessage) => {
    if (!navigator?.clipboard?.writeText) {
      setPlayerMessage('Copy is not supported in this browser.')
      return false
    }

    try {
      await navigator.clipboard.writeText(url)
      setPlayerMessage(successMessage)
      return true
    } catch (copyError) {
      setPlayerMessage('Could not copy the track link.')
      console.error(copyError)
      return false
    }
  }

  const handleShare = async () => {
    if (!track || typeof window === 'undefined') return

    const shareUrl = window.location.href

    if (navigator?.share) {
      try {
        await navigator.share({
          title: `${track.title} - ${track.artist}`,
          text: `Listen to ${track.title} by ${track.artist}`,
          url: shareUrl,
        })
        setPlayerMessage('Share sheet opened.')
        return
      } catch (shareError) {
        if (shareError?.name === 'AbortError') {
          return
        }
      }
    }

    await copyShareLink(shareUrl, 'Track link copied.')
  }

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return
    await copyShareLink(window.location.href, 'Track link copied.')
  }

  const handleDownload = async () => {
    if (!track || typeof document === 'undefined') return

    const sourceUrl = streamInfo?.url ?? track.audioUrl
    if (!sourceUrl) {
      setPlayerMessage('Download is not available for this track.')
      return
    }

    const baseName = sanitizeFilenamePart(`${track.artist} - ${track.title}`) || 'track'
    setIsDownloading(true)
    setPlayerMessage('')

    try {
      const downloadInfo = await getDownloadUrl(track.id)
      const downloadUrl = downloadInfo?.url ?? sourceUrl

      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      const blob = await response.blob()
      const extension = inferDownloadExtension(downloadUrl, blob.type)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = objectUrl
      link.download = `${baseName}.${extension}`
      link.style.display = 'none'

      document.body.appendChild(link)
      link.click()
      link.remove()

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      setPlayerMessage('Download started. Check your Downloads folder.')
    } catch (downloadError) {
      console.error(downloadError)

      if (downloadError?.status === 403) {
        setPlayerMessage(downloadError.message || 'Download is only available on the ArtistPro plan.')
        return
      }

      try {
        const fallbackLink = document.createElement('a')
        fallbackLink.href = sourceUrl
        fallbackLink.download = `${baseName}.mp3`
        fallbackLink.target = '_blank'
        fallbackLink.rel = 'noreferrer'
        fallbackLink.style.display = 'none'

        document.body.appendChild(fallbackLink)
        fallbackLink.click()
        fallbackLink.remove()

        setPlayerMessage('Download was triggered. If it did not save, allow downloads in your browser.')
      } catch (fallbackError) {
        console.error(fallbackError)
        setPlayerMessage('Could not download this track right now.')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePreviousTrack = async () => {
    if (!mockTrackOrder.length) return

    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }

    const safeIndex = currentTrackIndex >= 0 ? currentTrackIndex : 0
    const previousIndex =
      (safeIndex - 1 + mockTrackOrder.length) % mockTrackOrder.length
    navigate(buildTrackPath(mockTrackOrder[previousIndex], view))
  }

  const handleNextTrack = async () => {
    if (!mockTrackOrder.length) return

    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }

    const safeIndex = currentTrackIndex >= 0 ? currentTrackIndex : 0
    const nextIndex = (safeIndex + 1) % mockTrackOrder.length
    navigate(buildTrackPath(mockTrackOrder[nextIndex], view))
  }

  if (isLoading) {
    return (
      <div className="app-shell">
        <LoadingState label="Loading track experience" />
      </div>
    )
  }

  if (!track || error) {
    if (isAuthError) {
      return (
        <div className="app-shell">
          <main className="page">
            <section className="auth-token-panel">
              <div className="auth-token-copy">
                <span className="tag">Backend connection</span>
                <h1>Enter your access token</h1>
                <p>{error}</p>
              </div>

              <form className="auth-token-form" onSubmit={handleTokenSubmit}>
                <label className="auth-token-field">
                  <span>Access token</span>
                  <textarea
                    value={tokenInput}
                    onChange={(event) => setTokenInput(event.target.value)}
                    placeholder="Paste your backend access token here"
                    rows={6}
                  />
                </label>

                <div className="auth-token-actions">
                  <button className="comment-submit" type="submit">
                    Save and retry
                  </button>
                  <button
                    className="action-square"
                    type="button"
                    onClick={handleClearToken}
                  >
                    Clear token
                  </button>
                </div>
              </form>
            </section>
          </main>
        </div>
      )
    }

    return (
      <div className="app-shell">
        <LoadingState label={error || 'Track unavailable'} />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <main className="page">
        <TrackHeader
          track={track}
          comments={comments}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          currentTime={currentTime}
          duration={duration}
        />

        <div className="content-grid">
          <div className="content-column">
            <PlayerCard
              track={track}
              commentCount={commentTotal}
              currentTime={currentTime}
              isDownloading={isDownloading}
              message={playerMessage}
              onAddComment={handleAddComment}
              onDownload={handleDownload}
              onLikeToggle={handleLikeToggle}
              onRepostToggle={handleRepostToggle}
              onShare={handleShare}
              onCopyLink={handleCopyLink}
              view={view}
            />

            {sectionConfig ? (
              <EngagementListModal
                title={sectionConfig.title}
                description={sectionConfig.description}
                variant={sectionConfig.variant}
                items={sectionConfig.items}
              />
            ) : (
              <Comments
                comments={visibleComments}
                totalCount={commentTotal}
                onDeleteComment={handleDeleteComment}
                onJumpToTime={handleSeek}
                onLoadReplies={handleLoadReplies}
                onMessage={setPlayerMessage}
                mode={view === 'comments' ? 'page' : 'overview'}
              />
            )}
          </div>

          <HistoryPanel
            track={track}
            currentView={view}
            fanLeaderboard={fanLeaderboard}
            relatedTracks={relatedTracks}
            playlists={playlists}
            likers={likers}
            reposters={reposters}
            isPlaying={isPlaying}
            onLikeToggle={handleLikeToggle}
            onTogglePlay={handleTogglePlay}
          />
        </div>
      </main>

      <PlayerDock
        track={track}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onVolume={setVolume}
        playbackState={playbackState}
        onPreviousTrack={handlePreviousTrack}
        onNextTrack={handleNextTrack}
      />

      <audio
        ref={audioRef}
        src={streamInfo?.url ?? track.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPause={handlePause}
        onEnded={handleEnded}
      />
    </div>
  )
}

export default TrackPage
