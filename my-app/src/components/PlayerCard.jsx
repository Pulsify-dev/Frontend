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

function PlayerCard({
  track,
  commentCount,
  currentTime,
  isDownloading,
  message,
  onAddComment,
  onDownload,
  onLikeToggle,
  onRepostToggle,
  onShare,
  onShareToMessage,
  onCopyLink,
  view,
}) {
  const [text, setText] = useState('')
  const [attachTimestamp, setAttachTimestamp] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

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
    } catch {
      setError('Comment could not be posted.')
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
          <button
            className={`action-square ${track.viewerHasLiked ? 'is-active' : ''}`}
            type="button"
            onClick={onLikeToggle}
          >
            Like
          </button>
          <button
            className={`action-square ${track.viewerHasReposted ? 'is-active' : ''}`}
            type="button"
            onClick={onRepostToggle}
          >
            Repost
          </button>
          <button className="action-square" type="button" onClick={onShare}>
            Share
          </button>
          {onShareToMessage ? (
            <button className="action-square" type="button" onClick={onShareToMessage}>
              Message
            </button>
          ) : null}
          <button className="action-square" type="button" onClick={onCopyLink}>
            Copy
          </button>
          <button
            className="action-square"
            type="button"
            onClick={onDownload}
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading' : 'Download'}
          </button>
          <Link
            className={`action-link ${view === 'comments' ? 'is-current' : ''}`}
            to={`/tracks/${track.id}/comments`}
          >
            Comments
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
