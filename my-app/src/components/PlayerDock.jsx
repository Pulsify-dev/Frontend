import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
  const mins = Math.floor(safeSeconds / 60)
  const secs = Math.floor(safeSeconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const IconPrevious = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 5h2v14H6z" />
    <path d="M19 5 9 12l10 7V5z" />
  </svg>
)

const IconNext = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16 5h2v14h-2z" />
    <path d="m5 5 10 7-10 7V5z" />
  </svg>
)

const IconPlay = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const IconPause = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
  </svg>
)

const IconShuffle = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16 3h5v5h-2V6.4l-4.5 4.5-1.4-1.4L17.6 5H16V3z" />
    <path d="M4 7h3.4l9.2 9.2H19V14h2v5h-5v-2h1.2L6.6 9H4V7z" />
    <path d="M4 17h3.4l2.3-2.3 1.4 1.4L8.2 19H4v-2z" />
  </svg>
)

const IconRepeat = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 7h9.6L15 5.4 16.4 4 20.4 8l-4 4L15 10.6 16.6 9H7a3 3 0 0 0 0 6h1v2H7A5 5 0 0 1 7 7z" />
    <path d="M17 17H7.4L9 18.6 7.6 20l-4-4 4-4L9 13.4 7.4 15H17a3 3 0 0 0 0-6h-1V7h1a5 5 0 0 1 0 10z" />
  </svg>
)

const IconVolume = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16 8.5a5 5 0 0 1 0 7l1.4 1.4a7 7 0 0 0 0-9.8L16 8.5z" />
  </svg>
)

const IconHeart = ({ filled = false }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 21.2 10.6 20C5.4 15.3 2 12.2 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.7-3.4 6.8-8.6 11.5L12 21.2z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
)

const IconQueue = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 6h16v2H4zM4 11h16v2H4zM4 16h10v2H4z" />
    <path d="m17 15 4 3-4 3v-6z" />
  </svg>
)

const IconClose = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5z" />
    <path d="M17.6 5 19 6.4 6.4 19 5 17.6 17.6 5z" />
  </svg>
)

function PlayerDock({
  track,
  isPlaying,
  isPreparing = false,
  currentTime,
  duration,
  volume,
  onTogglePlay,
  onPreviousTrack,
  onNextTrack,
  onSeek,
  onVolume,
  playbackState,
  hasPrevious = true,
  hasNext = true,
  message = '',
  onClearMessage,
  isLiked = false,
  onLikeToggle,
  isLikePending = false,
  queueTracks = [],
  onQueueTrackSelect,
  onClearQueue,
  onQueueTrackLike,
  pendingQueueLikeIds = {},
}) {
  const [isNextUpOpen, setIsNextUpOpen] = useState(false)
  const [isAutoplayStationOn, setIsAutoplayStationOn] = useState(true)
  const activeTrack = useMemo(() => track ?? {}, [track])
  const safeDuration = duration || activeTrack.duration || 0
  const dockQueueTracks = useMemo(() => {
    const items = queueTracks.length ? queueTracks : [activeTrack]
    const itemMap = new Map()

    items.forEach((item) => {
      if (!item?.id || itemMap.has(item.id)) return
      itemMap.set(
        item.id,
        item.id === activeTrack.id ? { ...item, ...activeTrack } : item,
      )
    })

    if (activeTrack?.id && !itemMap.has(activeTrack.id)) {
      itemMap.set(activeTrack.id, activeTrack)
    }

    return [...itemMap.values()]
  }, [activeTrack, queueTracks])

  if (!track) return null

  const isBlocked = playbackState === 'Blocked'
  const progressValue = Math.min(currentTime, safeDuration || 0)

  return (
    <div className="player-dock-shell">
      {isNextUpOpen ? (
        <aside className="dock-next-panel" aria-label="Next up">
          <div className="dock-next-header">
            <h2>Next up</h2>
            <button className="dock-next-clear" type="button" onClick={onClearQueue}>
              Clear
            </button>
            <button
              className="dock-next-close"
              type="button"
              onClick={() => setIsNextUpOpen(false)}
              aria-label="Close Next up"
            >
              <IconClose />
            </button>
          </div>

          <div className="dock-next-list">
            {dockQueueTracks.map((queueTrack) => {
              const isCurrentQueueTrack = queueTrack.id === track.id
              const queueTrackLiked = Boolean(queueTrack.viewerHasLiked)

              return (
                <article
                  className={`dock-next-item ${isCurrentQueueTrack ? 'is-current' : ''}`}
                  key={`next-up-${queueTrack.id}`}
                >
                  <button
                    className="dock-next-play"
                    type="button"
                    onClick={() => onQueueTrackSelect?.(queueTrack)}
                    aria-label={`Play ${queueTrack.title}`}
                  >
                    {isCurrentQueueTrack && isPlaying ? <IconPause /> : <IconPlay />}
                  </button>

                  <img src={queueTrack.cover || track.cover} alt="" />

                  <div className="dock-next-copy">
                    <span>{queueTrack.artist || 'Music'}</span>
                    <strong>{queueTrack.title}</strong>
                  </div>

                  <span className="dock-next-duration">
                    {formatTime(queueTrack.duration)}
                  </span>

                  <button
                    className={`dock-next-heart ${queueTrackLiked ? 'is-liked' : ''}`}
                    type="button"
                    onClick={() => onQueueTrackLike?.(queueTrack)}
                    disabled={Boolean(pendingQueueLikeIds[queueTrack.id])}
                    aria-label={
                      queueTrackLiked
                        ? `Unlike ${queueTrack.title}`
                        : `Like ${queueTrack.title}`
                    }
                  >
                    <IconHeart filled={queueTrackLiked} />
                  </button>
                </article>
              )
            })}
          </div>

          <div className="dock-autoplay-row">
            <div>
              <strong>Autoplay station</strong>
              <p>Hear related tracks based on what's playing now.</p>
            </div>
            <button
              className={`dock-autoplay-toggle ${
                isAutoplayStationOn ? 'is-on' : ''
              }`}
              type="button"
              onClick={() => setIsAutoplayStationOn((current) => !current)}
              aria-label="Toggle autoplay station"
            >
              <span />
            </button>
          </div>
        </aside>
      ) : null}

      <div className="player-dock">
        <div className="player-dock-main">
          <div className="dock-control-group">
            <button
              className="dock-icon-button"
              type="button"
              onClick={onPreviousTrack}
              aria-label="Previous track"
              disabled={!hasPrevious}
            >
              <IconPrevious />
            </button>
            <button
              className="dock-play-button"
              type="button"
              onClick={onTogglePlay}
              disabled={isBlocked || isPreparing}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPreparing ? (
                <span className="dock-loading-dot" />
              ) : isPlaying ? (
                <IconPause />
              ) : (
                <IconPlay />
              )}
            </button>
            <button
              className="dock-icon-button"
              type="button"
              onClick={onNextTrack}
              aria-label="Next track"
              disabled={!hasNext}
            >
              <IconNext />
            </button>
            <button className="dock-icon-button dock-icon-button--muted" type="button">
              <IconShuffle />
            </button>
            <button className="dock-icon-button dock-icon-button--muted" type="button">
              <IconRepeat />
            </button>
          </div>

          <div className="dock-progress-group">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={safeDuration || 0}
              value={progressValue}
              onChange={(event) => onSeek(Number(event.target.value))}
              aria-label="Playback progress"
              disabled={isBlocked}
            />
            <span>{formatTime(safeDuration)}</span>
          </div>

          <div className="dock-side-group">
            <div className="dock-volume">
              <button className="dock-volume-button" type="button" aria-label="Volume">
                <IconVolume />
              </button>
              <div className="dock-volume-popover">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(event) => onVolume(Number(event.target.value))}
                  aria-label="Volume"
                />
              </div>
            </div>

            <Link className="dock-track" to={`/tracks/${track.id}`}>
              <img src={track.cover} alt="" />
              <div>
                <p>{track.artist}</p>
                <strong>{track.title}</strong>
              </div>
            </Link>

            <button
              className={`dock-heart-button ${isLiked ? 'is-liked' : ''}`}
              type="button"
              onClick={onLikeToggle}
              disabled={isLikePending}
              aria-label={isLiked ? `Unlike ${track.title}` : `Like ${track.title}`}
            >
              <IconHeart filled={isLiked} />
            </button>

            <button
              className={`dock-next-button ${isNextUpOpen ? 'is-open' : ''}`}
              type="button"
              onClick={() => setIsNextUpOpen((current) => !current)}
              aria-label="Next up"
            >
              <IconQueue />
            </button>
          </div>
        </div>

        {message ? (
          <div className="player-dock-message" role="status" aria-live="polite">
            <span>{message}</span>
            {onClearMessage ? (
              <button type="button" onClick={onClearMessage}>
                Dismiss
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default PlayerDock
