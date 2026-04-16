import { Link } from 'react-router-dom'

const formatRelativeDate = (value) => {
  const then = new Date(value)
  const now = new Date()
  const diffMs = then.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (Math.abs(diffDays) < 30) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      diffDays,
      'day',
    )
  }

  const diffMonths = Math.round(diffDays / 30)
  if (Math.abs(diffMonths) < 12) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      diffMonths,
      'month',
    )
  }

  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.round(diffDays / 365),
    'year',
  )
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function TrackHeader({
  track,
  comments,
  isPlaying,
  onTogglePlay,
  onSeek,
  currentTime,
  duration,
}) {
  const waveform = track.waveform?.length
    ? track.waveform
    : Array.from({ length: 140 }, (_, index) => 0.22 + ((index % 7) + 1) / 12)

  const pinnedComments = comments
    .filter((comment) => typeof comment.timestamp_ms === 'number')
    .slice(0, 16)

  return (
    <section className="track-hero">
      <div className="track-hero-main">
        <div className="track-hero-head">
          <button
            className={`hero-play ${isPlaying ? 'is-playing' : ''}`}
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause track' : 'Play track'}
          >
            <span />
          </button>

          <div className="track-hero-copy">
            <span className="track-type-pill">{track.typeLabel}</span>
            <h1>{track.title}</h1>
            <Link className="track-artist-chip" to="/profile">
              {track.artist}
            </Link>
          </div>

          <span className="track-hero-age">{formatRelativeDate(track.postedAt)}</span>
        </div>

        <div className="track-waveform-card">
          <div className="track-waveform" aria-label="Track waveform">
            {waveform.map((point, index) => {
              const barTime = duration
                ? (index / Math.max(waveform.length - 1, 1)) * duration
                : 0
              const isActive = barTime <= currentTime

              return (
                <button
                  key={`${track.id}-${index}`}
                  className={`track-wave ${isActive ? 'is-active' : ''}`}
                  type="button"
                  style={{ '--wave-height': `${Math.max(point * 100, 12)}%` }}
                  onClick={() => onSeek(barTime)}
                  aria-label={`Seek to ${formatTime(barTime)}`}
                />
              )
            })}

            {pinnedComments.map((comment, index) => (
              <button
                key={comment.id}
                className="track-comment-badge"
                type="button"
                style={{
                  left: `${(comment.timestamp_ms / 1000 / Math.max(duration, 1)) * 100}%`,
                  '--comment-offset': `${(index % 4) * 3}px`,
                }}
                onClick={() => onSeek(comment.timestamp_ms / 1000)}
                aria-label={`Jump to comment from ${comment.user.name}`}
                title={`${comment.user.name}: ${comment.text}`}
              >
                <img src={comment.user.avatar} alt={comment.user.name} />
              </button>
            ))}

            <span className="track-duration-badge">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="track-hero-art">
        <img src={track.cover} alt={track.title} />
      </div>
    </section>
  )
}

export default TrackHeader
