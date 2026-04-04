const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatCount = (value) => new Intl.NumberFormat('en-US').format(value ?? 0)

function PlayerCard({
  track,
  comments,
  duration,
  isPlaying,
  currentTime,
  onTogglePlay,
  onSeek,
  volume,
  onVolume,
  progress,
  playbackState,
  previewDurationSeconds,
  message,
  onLikeToggle,
  onRepostToggle,
  onOpenLikers,
  onOpenReposters,
}) {
  const waveform = track.waveform?.length
    ? track.waveform
    : Array.from({ length: 60 }, (_, index) => 0.2 + ((index % 5) + 1) / 10)

  const previewLimit =
    playbackState === 'Preview' && duration
      ? (previewDurationSeconds / duration) * 100
      : null

  return (
    <section className="module-card player-card" id="stream">
      <div className="section-heading">
        <div>
          <h2>High-Fidelity Streaming</h2>
          <p>Play, seek, gate previews, and keep social engagement in one surface.</p>
        </div>
        <div className="playback-summary">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="waveform-shell">
        <div className="waveform-grid" aria-label="Waveform preview">
          {waveform.map((point, index) => {
            const barTime = duration
              ? (index / Math.max(waveform.length - 1, 1)) * duration
              : 0
            const isActive = barTime <= currentTime

            return (
              <button
                key={`${index}-${point}`}
                className={`waveform-bar ${isActive ? 'is-active' : ''}`}
                type="button"
                style={{ '--bar-height': `${Math.max(point * 100, 16)}%` }}
                onClick={() => onSeek(barTime)}
                aria-label={`Seek to ${formatTime(barTime)}`}
              />
            )
          })}

          {comments
            .filter((comment) => typeof comment.timestamp_ms === 'number')
            .map((comment) => (
              <button
                key={comment.id}
                className="comment-marker"
                type="button"
                style={{
                  left: `${(comment.timestamp_ms / 1000 / Math.max(duration, 1)) * 100}%`,
                }}
                onClick={() => onSeek(comment.timestamp_ms / 1000)}
                aria-label={`Jump to comment from ${comment.user.name}`}
                title={`${comment.user.name}: ${comment.text}`}
              />
            ))}

          {previewLimit ? (
            <div
              className="preview-limit"
              style={{ left: `${Math.min(previewLimit, 100)}%` }}
            />
          ) : null}
        </div>

        <div className="range-row">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => onSeek(Number(event.target.value))}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="transport-row">
        <div className="transport-cluster">
          <button
            className="primary-action"
            type="button"
            onClick={onTogglePlay}
            disabled={playbackState === 'Blocked'}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button type="button" onClick={() => onSeek(Math.max(currentTime - 10, 0))}>
            -10s
          </button>
          <button
            type="button"
            onClick={() => onSeek(Math.min(currentTime + 10, duration))}
          >
            +10s
          </button>
        </div>

        <div className="engagement-actions">
          <button
            className={track.viewerHasLiked ? 'is-active' : ''}
            type="button"
            onClick={onLikeToggle}
          >
            {track.viewerHasLiked ? 'Liked' : 'Like'} {formatCount(track.likeCount)}
          </button>
          <button
            className={track.viewerHasReposted ? 'is-active' : ''}
            type="button"
            onClick={onRepostToggle}
          >
            {track.viewerHasReposted ? 'Reposted' : 'Repost'}{' '}
            {formatCount(track.repostCount)}
          </button>
          <button type="button" onClick={onOpenLikers}>
            Favoriters
          </button>
          <button type="button" onClick={onOpenReposters}>
            Reposters
          </button>
        </div>
      </div>

      <div className="volume-row">
        <label htmlFor="player-volume">Volume</label>
        <input
          id="player-volume"
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(event) => onVolume(Number(event.target.value))}
        />
        <span>{progress.toFixed(0)}% played</span>
      </div>

      {message ? <p className="panel-notice">{message}</p> : null}
    </section>
  )
}

export default PlayerCard
