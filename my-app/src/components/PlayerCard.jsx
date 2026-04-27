import { useState } from 'react'
import { Link } from 'react-router-dom'

const formatCount = (value) => {
  const numericValue = Number(value) || 0

  if (numericValue >= 1000000) {
    return `${(numericValue / 1000000).toFixed(numericValue >= 10000000 ? 0 : 1)}M`
  }

  if (numericValue >= 1000) {
    return `${Math.round(numericValue / 100) / 10}K`
  }

  return `${numericValue}`
}

const ActionIcon = ({ type, active = false }) => {
  if (type === 'like') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 21.2 10.6 20C5.4 15.3 2 12.2 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.7-3.4 6.8-8.6 11.5L12 21.2z"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    )
  }

  if (type === 'repost') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17 2 22 7l-5 5V8H7a3 3 0 0 0-3 3v1H2v-1a5 5 0 0 1 5-5h10V2z" />
        <path d="M7 22 2 17l5-5v4h10a3 3 0 0 0 3-3v-1h2v1a5 5 0 0 1-5 5H7v4z" />
      </svg>
    )
  }

  if (type === 'share') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7h-2v6H6v-6H4z" />
        <path d="M11 16h2V6.8l3.6 3.6L18 9 12 3 6 9l1.4 1.4L11 6.8V16z" />
      </svg>
    )
  }

  if (type === 'copy') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 8h13v13H8V8zm2 2v9h9v-9h-9z" />
        <path d="M3 3h13v3h-2V5H5v9h1v2H3V3z" />
      </svg>
    )
  }

  if (type === 'download') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11 4h2v9.2l3.6-3.6L18 11l-6 6-6-6 1.4-1.4 3.6 3.6V4z" />
        <path d="M5 19h14v2H5z" />
      </svg>
    )
  }

  if (type === 'comments') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h16v12H8l-4 4V4zm2 2v9.2L7.2 14H18V6H6z" />
      </svg>
    )
  }

  if (type === 'favoriters') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-3.3 0-7 1.7-7 4v2h14v-2c0-2.3-3.7-4-7-4z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17 2 22 7l-5 5V8H7a3 3 0 0 0-3 3v1H2v-1a5 5 0 0 1 5-5h10V2z" />
      <path d="M7 22 2 17l5-5v4h10a3 3 0 0 0 3-3v-1h2v1a5 5 0 0 1-5 5H7v4z" />
    </svg>
  )
}

function PlayerCard({
  track,
  commentCount,
  currentTime,
  isDownloading,
  message,
  playbackState = 'Playable',
  previewDurationSeconds = 0,
  onAddComment,
  onDownload,
  onLikeToggle,
  onRepostToggle,
  onShare,
  onCopyLink,
  view,
}) {
  const [text, setText] = useState('')
  const [attachTimestamp, setAttachTimestamp] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const playbackStateLabel =
    playbackState === 'Blocked'
      ? 'Blocked by region or tier'
      : playbackState === 'Preview'
        ? `Preview only - ${previewDurationSeconds || 30}s`
        : 'Full track available'

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedText = text.trim()
    if (!trimmedText) {
      setError('Write a comment first.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onAddComment({
        text: trimmedText,
        timestamp_ms: attachTimestamp ? Math.floor(currentTime * 1000) : null,
      })
      setText('')
    } catch (error) {
      setError(error?.message || 'Comment could not be posted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="social-panel">
      <form className="social-comment-bar" onSubmit={handleSubmit}>
        <div className="comment-avatar-shell" aria-hidden="true">
          <span />
        </div>

        <label className="comment-input-shell">
          <span className="sr-only">Write a comment</span>
          <input
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Write a comment"
          />
        </label>

        <button className="comment-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending' : 'Send'}
        </button>
      </form>

      <div className="track-actions-row">
        <div className="track-actions">
          <span className={`playback-state-chip is-${playbackState.toLowerCase()}`}>
            {playbackStateLabel}
          </span>
          <button
            className={`action-square action-square--icon ${
              track.viewerHasLiked ? 'is-active' : ''
            }`}
            type="button"
            onClick={onLikeToggle}
            title={track.viewerHasLiked ? 'Unlike' : 'Like'}
            aria-label={track.viewerHasLiked ? 'Unlike track' : 'Like track'}
          >
            <ActionIcon type="like" active={track.viewerHasLiked} />
            <span className="sr-only">{track.viewerHasLiked ? 'Unlike' : 'Like'}</span>
          </button>
          <button
            className={`action-square action-square--icon ${
              track.viewerHasReposted ? 'is-active' : ''
            }`}
            type="button"
            onClick={onRepostToggle}
            title={track.viewerHasReposted ? 'Undo repost' : 'Repost'}
            aria-label={track.viewerHasReposted ? 'Undo repost' : 'Repost track'}
          >
            <ActionIcon type="repost" active={track.viewerHasReposted} />
            <span className="sr-only">
              {track.viewerHasReposted ? 'Undo repost' : 'Repost'}
            </span>
          </button>
          <button
            className="action-square action-square--icon"
            type="button"
            onClick={onShare}
            title="Share"
            aria-label="Share track"
          >
            <ActionIcon type="share" />
            <span className="sr-only">Share</span>
          </button>
          <button
            className="action-square action-square--icon"
            type="button"
            onClick={onCopyLink}
            title="Copy link"
            aria-label="Copy track link"
          >
            <ActionIcon type="copy" />
            <span className="sr-only">Copy link</span>
          </button>
          <button
            className="action-square action-square--icon"
            type="button"
            onClick={onDownload}
            disabled={isDownloading}
            title={isDownloading ? 'Downloading' : 'Download'}
            aria-label={isDownloading ? 'Downloading track' : 'Download track'}
          >
            <ActionIcon type="download" />
            <span className="sr-only">
              {isDownloading ? 'Downloading' : 'Download'}
            </span>
          </button>
          <Link
            className={`action-link action-link--icon ${
              view === 'comments' ? 'is-current' : ''
            }`}
            to={`/tracks/${track.id}/comments`}
            title="Comments"
          >
            <ActionIcon type="comments" />
            <span>Comments</span>
          </Link>
          <Link
            className={`action-link action-link--icon ${
              view === 'likes' ? 'is-current' : ''
            }`}
            to={`/tracks/${track.id}/likes`}
            title="Favoriters"
          >
            <ActionIcon type="favoriters" />
            <span>Favoriters</span>
          </Link>
          <Link
            className={`action-link action-link--icon ${
              view === 'reposts' ? 'is-current' : ''
            }`}
            to={`/tracks/${track.id}/reposts`}
            title="Reposters"
          >
            <ActionIcon type="reposts" />
            <span>Reposters</span>
          </Link>
        </div>

        <div className="track-stat-row">
          <span>{formatCount(track.playCount)} plays</span>
          <span>{formatCount(track.likeCount)} likes</span>
          <span>{formatCount(track.repostCount)} reposts</span>
          <span>{formatCount(commentCount)} comments</span>
        </div>
      </div>

      <div className="comment-helper-row">
        <label className="timestamp-option">
          <input
            type="checkbox"
            checked={attachTimestamp}
            onChange={(event) => setAttachTimestamp(event.target.checked)}
          />
          <span>Attach current timestamp</span>
        </label>

        {message ? <p className="panel-notice">{message}</p> : null}
        {error ? <p className="panel-notice panel-notice-error">{error}</p> : null}
      </div>
    </section>
  )
}

export default PlayerCard
