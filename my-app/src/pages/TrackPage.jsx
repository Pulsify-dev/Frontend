import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import Comments from '../components/Comments'
import EngagementListModal from '../components/EngagementListModal'
import HistoryPanel from '../components/HistoryPanel'
import LoadingState from '../components/LoadingState'
import PlayerCard from '../components/PlayerCard'
import PlayerDock from '../components/PlayerDock'
import TrackHeader from '../components/TrackHeader'
import {
  createComment,
  getComments,
  getLikers,
  getListeningHistory,
  getRecentlyPlayed,
  getReposters,
  getStreamUrl,
  getTrack,
  getWaveform,
  registerPlay,
  toggleLike,
  toggleRepost,
} from '../services/api'
import '../App.css'

const DEFAULT_TRACK_ID = import.meta.env.VITE_TRACK_ID ?? 'trk-2026-014'

const sortComments = (items) =>
  [...items].sort((left, right) => {
    const leftTime = left.timestamp_ms ?? Number.MAX_SAFE_INTEGER
    const rightTime = right.timestamp_ms ?? Number.MAX_SAFE_INTEGER
    return leftTime - rightTime
  })

function TrackPage() {
  const { trackId: routeTrackId } = useParams()
  const trackId = routeTrackId ?? DEFAULT_TRACK_ID
  const audioRef = useRef(null)
  const sessionReportedRef = useRef(false)

  const [track, setTrack] = useState(null)
  const [streamInfo, setStreamInfo] = useState(null)
  const [comments, setComments] = useState([])
  const [recentlyPlayed, setRecentlyPlayed] = useState([])
  const [listeningHistory, setListeningHistory] = useState([])
  const [likers, setLikers] = useState([])
  const [reposters, setReposters] = useState([])
  const [activeList, setActiveList] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(70)
  const [playerMessage, setPlayerMessage] = useState('')
  const [isDockExpanded, setIsDockExpanded] = useState(false)

  const playbackState = streamInfo?.playback_state ?? track?.playbackState ?? 'Playable'
  const previewDurationSeconds =
    streamInfo?.preview_duration_seconds ?? track?.previewDurationSeconds ?? 0

  const progress = useMemo(() => {
    if (!duration) return 0
    return (currentTime / duration) * 100
  }, [currentTime, duration])

  const activeUsers = activeList === 'likers' ? likers : reposters
  const activeTitle = activeList === 'likers' ? 'Favoriters' : 'Reposters'

  const refreshActivity = async () => {
    const [recentResult, historyResult] = await Promise.allSettled([
      getRecentlyPlayed(),
      getListeningHistory(),
    ])

    if (recentResult.status === 'fulfilled') {
      setRecentlyPlayed(recentResult.value)
    }

    if (historyResult.status === 'fulfilled') {
      setListeningHistory(historyResult.value)
    }
  }

  useEffect(() => {
    let isMounted = true

    const loadTrack = async () => {
      setIsLoading(true)
      setError('')
      setPlayerMessage('')
      setCurrentTime(0)
      setIsPlaying(false)
      setIsDockExpanded(false)
      sessionReportedRef.current = false

      const results = await Promise.allSettled([
        getTrack(trackId),
        getWaveform(trackId),
        getStreamUrl(trackId),
        getComments(trackId),
        getRecentlyPlayed(),
        getListeningHistory(),
        getLikers(trackId),
        getReposters(trackId),
      ])

      if (!isMounted) return

      const trackResult = results[0]
      if (trackResult.status !== 'fulfilled') {
        setError('Track unavailable right now.')
        setIsLoading(false)
        return
      }

      const baseTrack = trackResult.value
      const waveformResult = results[1]
      const mergedTrack = {
        ...baseTrack,
        waveform:
          waveformResult.status === 'fulfilled' && waveformResult.value.length
            ? waveformResult.value
            : baseTrack.waveform,
      }

      setTrack(mergedTrack)
      setDuration(mergedTrack.duration ?? 0)
      setStreamInfo(
        results[2].status === 'fulfilled'
          ? results[2].value
          : {
              url: mergedTrack.audioUrl,
              playback_state: mergedTrack.playbackState,
              preview_duration_seconds: mergedTrack.previewDurationSeconds,
            },
      )
      setComments(
        results[3].status === 'fulfilled' ? sortComments(results[3].value) : [],
      )
      setRecentlyPlayed(results[4].status === 'fulfilled' ? results[4].value : [])
      setListeningHistory(results[5].status === 'fulfilled' ? results[5].value : [])
      setLikers(results[6].status === 'fulfilled' ? results[6].value : [])
      setReposters(results[7].status === 'fulfilled' ? results[7].value : [])
      setIsLoading(false)
    }

    loadTrack()

    return () => {
      isMounted = false
    }
  }, [trackId])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume / 100
  }, [volume])

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

  const submitPlayEvent = async () => {
    const playedMs = Math.round((audioRef.current?.currentTime ?? currentTime) * 1000)

    if (!track || playedMs < 5000 || sessionReportedRef.current) {
      return
    }

    sessionReportedRef.current = true

    try {
      await registerPlay(track.id, { duration_played_ms: playedMs })
      await refreshActivity()
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
      setPlayerMessage(
        `Preview ended at ${Math.floor(previewDurationSeconds)} seconds.`
      )
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
    setComments((currentComments) => sortComments([...currentComments, comment]))
    setTrack((currentTrack) => ({
      ...currentTrack,
      commentCount: currentTrack.commentCount + 1,
    }))
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
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          playbackState={playbackState}
          previewDurationSeconds={previewDurationSeconds}
        />

        <div className="content-grid">
          <div className="content-column">
            <PlayerCard
              track={track}
              comments={comments}
              duration={duration}
              isPlaying={isPlaying}
              currentTime={currentTime}
              onTogglePlay={handleTogglePlay}
              onSeek={handleSeek}
              volume={volume}
              onVolume={setVolume}
              progress={progress}
              playbackState={playbackState}
              previewDurationSeconds={previewDurationSeconds}
              message={playerMessage}
              onLikeToggle={handleLikeToggle}
              onRepostToggle={handleRepostToggle}
              onOpenLikers={() => setActiveList('likers')}
              onOpenReposters={() => setActiveList('reposters')}
            />

            <Comments
              comments={comments}
              currentTime={currentTime}
              onAddComment={handleAddComment}
              onJumpToTime={handleSeek}
            />
          </div>

          <HistoryPanel
            track={track}
            recentlyPlayed={recentlyPlayed}
            listeningHistory={listeningHistory}
            playbackState={playbackState}
          />
        </div>
      </main>

      <PlayerDock
        track={track}
        comments={comments}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onTogglePlay={handleTogglePlay}
        onSeek={handleSeek}
        onVolume={setVolume}
        playbackState={playbackState}
        isExpanded={isDockExpanded}
        onToggleExpanded={setIsDockExpanded}
        onLikeToggle={handleLikeToggle}
        onRepostToggle={handleRepostToggle}
      />

      {activeList ? (
        <EngagementListModal
          title={activeTitle}
          users={activeUsers}
          onClose={() => setActiveList(null)}
        />
      ) : null}

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
