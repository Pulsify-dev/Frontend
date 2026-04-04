const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatCount = (value) => new Intl.NumberFormat('en-US').format(value ?? 0)

function PlayerDock({
  track,
  comments,
  isPlaying,
  currentTime,
  duration,
  volume,
  onTogglePlay,
  onSeek,
  onVolume,
  playbackState,
  isExpanded,
  onToggleExpanded,
  onLikeToggle,
  onRepostToggle,
}) {
  const previewComments = comments.slice(0, 3)
  const waveform = track.waveform?.length
    ? track.waveform.slice(0, 48)
    : Array.from({ length: 48 }, (_, index) => 0.2 + ((index % 6) + 1) / 11)

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggleExpanded(!isExpanded)
    }
  }

  return (
    <div className="player-dock-shell">
      {isExpanded ? (
        <div className="dock-panel">
          <div className="dock-panel-inner">
            <div className="dock-panel-head">
              <div>
                <span className="dock-label">Now playing</span>
                <h3>{track.title}</h3>
                <p>
                  {track.artist} • {playbackState}
                </p>
              </div>
              <button type="button" onClick={() => onToggleExpanded(false)}>
                Hide player
              </button>
            </div>

            <div className="dock-panel-body">
              <div className="dock-panel-art">
                <img src={track.cover} alt={track.title} />
              </div>

              <div className="dock-panel-main">
                <div className="dock-panel-waveform" aria-hidden="true">
                  {waveform.map((point, index) => {
                    const barTime = duration
                      ? (index / Math.max(waveform.length - 1, 1)) * duration
                      : 0
                    const isActive = barTime <= currentTime

                    return (
                      <button
                        key={`${index}-${point}`}
                        className={`dock-wave ${isActive ? 'is-active' : ''}`}
                        type="button"
                        style={{ '--dock-bar-height': `${Math.max(point * 100, 18)}%` }}
                        onClick={() => onSeek(barTime)}
                      />
                    )
                  })}
                </div>

                <div className="dock-panel-controls">
                  <button className="primary-action" type="button" onClick={onTogglePlay}>
                    {isPlaying ? 'Pause' : 'Play'}
                  </button>
                  <span className="dock-time">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <button
                    className={track.viewerHasLiked ? 'is-active' : ''}
                    type="button"
                    onClick={onLikeToggle}
                  >
                    Like {formatCount(track.likeCount)}
                  </button>
                  <button
                    className={track.viewerHasReposted ? 'is-active' : ''}
                    type="button"
                    onClick={onRepostToggle}
                  >
                    Repost {formatCount(track.repostCount)}
                  </button>
                </div>

                <div className="dock-panel-range">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={Math.min(currentTime, duration || 0)}
                    onChange={(event) => onSeek(Number(event.target.value))}
                    aria-label="Expanded playback progress"
                  />
                </div>

                <div className="dock-panel-volume">
                  <label htmlFor="dock-panel-volume">Volume</label>
                  <input
                    id="dock-panel-volume"
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(event) => onVolume(Number(event.target.value))}
                  />
                </div>
              </div>

              <div className="dock-panel-side">
                <span className="dock-label">Hot comments</span>
                <div className="dock-comment-list">
                  {previewComments.map((comment) => (
                    <button
                      key={comment.id}
                      className="dock-comment-card"
                      type="button"
                      onClick={() =>
                        typeof comment.timestamp_ms === 'number'
                          ? onSeek(comment.timestamp_ms / 1000)
                          : null
                      }
                    >
                      <strong>{comment.user.name}</strong>
                      <p>{comment.text}</p>
                      <span>
                        {typeof comment.timestamp_ms === 'number'
                          ? formatTime(comment.timestamp_ms / 1000)
                          : 'General'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="player-dock"
        onClick={() => onToggleExpanded(!isExpanded)}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="player-dock-main">
          <div className="dock-track">
            <img src={track.cover} alt={track.title} />
            <div>
              <strong>{track.title}</strong>
              <p>{track.artist}</p>
            </div>
          </div>

          <div className="dock-controls" onClick={(event) => event.stopPropagation()}>
            <div className="dock-buttons">
              <button
                className="primary-action"
                type="button"
                onClick={onTogglePlay}
                disabled={playbackState === 'Blocked'}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <span className="dock-time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <span className="dock-expand-hint">
                {isExpanded ? 'Tap to collapse' : 'Tap to expand'}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max={duration || 0}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => onSeek(Number(event.target.value))}
              aria-label="Playback progress"
            />
          </div>

          <div className="dock-volume" onClick={(event) => event.stopPropagation()}>
            <label htmlFor="dock-volume">Volume</label>
            <input
              id="dock-volume"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(event) => onVolume(Number(event.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerDock
