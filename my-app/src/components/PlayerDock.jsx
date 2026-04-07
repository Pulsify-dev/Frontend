const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function PlayerDock({
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  onTogglePlay,
  onPreviousTrack,
  onNextTrack,
  onSeek,
  onVolume,
  playbackState,
}) {
  return (
    <div className="player-dock-shell">
      <div className="player-dock">
        <div className="player-dock-main">
          <div className="dock-control-group">
            <button
              className="dock-icon-button"
              type="button"
              onClick={onPreviousTrack}
              aria-label="Previous track"
            >
              Prev
            </button>
            <button
              className="dock-play-button"
              type="button"
              onClick={onTogglePlay}
              disabled={playbackState === 'Blocked'}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              className="dock-icon-button"
              type="button"
              onClick={onNextTrack}
              aria-label="Next track"
            >
              Next
            </button>
          </div>

          <div className="dock-progress-group">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => onSeek(Number(event.target.value))}
              aria-label="Playback progress"
            />
            <span>{formatTime(duration)}</span>
          </div>

          <div className="dock-side-group">
            <label className="dock-volume">
              <span>Vol</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(event) => onVolume(Number(event.target.value))}
                aria-label="Volume"
              />
            </label>

            <div className="dock-track">
              <img src={track.cover} alt={track.title} />
              <div>
                <strong>{track.title}</strong>
                <p>{track.artist}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerDock
