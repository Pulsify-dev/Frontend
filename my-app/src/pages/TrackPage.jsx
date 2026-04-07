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
  createComment,
  getComments,
  getFanLeaderboard,
  getLikers,
  getRelatedTracks,
  getReposters,
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

const sortCommentsByTimeline = (items) =>
  [...items].sort((left, right) => {
    const leftTime = left.timestamp_ms ?? Number.MAX_SAFE_INTEGER
    const rightTime = right.timestamp_ms ?? Number.MAX_SAFE_INTEGER
    return leftTime - rightTime
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

  const [track, setTrack] = useState(null)
  const [streamInfo, setStreamInfo] = useState(null)
  const [comments, setComments] = useState([])
  const [relatedTracks, setRelatedTracks] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [fanLeaderboard, setFanLeaderboard] = useState([])
  const [likers, setLikers] = useState([])
  const [reposters, setReposters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
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

  useEffect(() => {
    let isMounted = true

    const loadTrack = async () => {
      setIsLoading(true)
      setError('')
      setPlayerMessage('')
      setCurrentTime(0)
      setIsPlaying(false)
      sessionReportedRef.current = false

      const results = await Promise.allSettled([
        getTrack(trackId),
        getStreamUrl(trackId),
        getComments(trackId),
        getLikers(trackId),
        getReposters(trackId),
        getRelatedTracks(trackId),
        getTrackPlaylists(trackId),
        getFanLeaderboard(trackId),
      ])

      if (!isMounted) return

      const trackResult = results[0]
      if (trackResult.status !== 'fulfilled') {
        setError('Track unavailable right now.')
        setIsLoading(false)
        return
      }

      const nextTrack = trackResult.value
      setTrack(nextTrack)
      setDuration(nextTrack.duration ?? 0)
      setStreamInfo(
        results[1].status === 'fulfilled'
          ? results[1].value
          : {
              url: nextTrack.audioUrl,
              playback_state: nextTrack.playbackState,
              preview_duration_seconds: nextTrack.previewDurationSeconds,
            },
      )
      setComments(
        results[2].status === 'fulfilled'
          ? sortCommentsByTimeline(results[2].value)
          : [],
      )
      setLikers(results[3].status === 'fulfilled' ? results[3].value : [])
      setReposters(results[4].status === 'fulfilled' ? results[4].value : [])
      setRelatedTracks(results[5].status === 'fulfilled' ? results[5].value : [])
      setPlaylists(results[6].status === 'fulfilled' ? results[6].value : [])
      setFanLeaderboard(results[7].status === 'fulfilled' ? results[7].value : [])
      setIsLoading(false)
    }

    loadTrack()

    return () => {
      isMounted = false
    }
  }, [trackId])

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
    setTrack((currentTrack) => ({
      ...currentTrack,
      commentCount: currentTrack.commentCount + 1,
    }))
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
              commentCount={comments.length}
              currentTime={currentTime}
              message={playerMessage}
              onAddComment={handleAddComment}
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
                totalCount={comments.length}
                onJumpToTime={handleSeek}
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
