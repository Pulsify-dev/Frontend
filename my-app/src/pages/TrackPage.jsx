import { useEffect, useMemo, useRef, useState } from 'react'
import AppHeader from '../components/AppHeader'
import LoadingState from '../components/LoadingState'
import PlayerCard from '../components/PlayerCard'
import TrackHeader from '../components/TrackHeader'
import { getTrack } from '../services/api'


function TrackPage() {
  const [track, setTrack] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(70)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const loadTrack = async () => {
      const data = await getTrack()
      setTrack(data)
      setDuration(data.duration ?? 0)
      setIsLoading(false)
    }
    loadTrack()
  }, [])

  useEffect(() => {
    if (!track || !audioRef.current) return
    audioRef.current.volume = volume / 100
  }, [track, volume])

  const progress = useMemo(() => {
    if (!duration) return 0
    return (currentTime / duration) * 100
  }, [currentTime, duration])

  if (isLoading) {
    return (
      <div className="app-shell">
        <AppHeader />
        <LoadingState label="Loading track" />
      </div>
    )
  }

  if (!track) {
    return (
      <div className="app-shell">
        <AppHeader />
        <LoadingState label="Track unavailable" />
      </div>
    )
  }

  const handleTogglePlay = async () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('Audio play failed', error)
    }
  }

  const handleSeek = (value) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = value
    setCurrentTime(value)
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return
    if (!Number.isNaN(audioRef.current.duration)) {
      setDuration(Math.floor(audioRef.current.duration))
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
  }

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="page">
        <TrackHeader track={track} />
        <PlayerCard
          duration={duration}
          isPlaying={isPlaying}
          currentTime={currentTime}
          onTogglePlay={handleTogglePlay}
          onSeek={handleSeek}
          volume={volume}
          onVolume={(value) => setVolume(value)}
          progress={progress}
        />
      </main>

      <audio
        ref={audioRef}
        src={track.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
    </div>
  )
}

export default TrackPage
