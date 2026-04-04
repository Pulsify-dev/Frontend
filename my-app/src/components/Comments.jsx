import { useState } from 'react'

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))

function Comments({ comments, currentTime, onAddComment, onJumpToTime }) {
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

    if (trimmedText.length > 300) {
      setError('Comments must be 300 characters or less.')
      return
    }

    setError('')
    setIsSubmitting(true)

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
    <section className="module-card comments-card" id="comments">
      <div className="section-heading">
        <div>
          <h2>Timestamped Comments</h2>
          <p>Drop feedback on an exact second in the waveform or leave a general note.</p>
        </div>
        <span className="count-badge">{comments.length} total</span>
      </div>

      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Share a moment, mix note, or reaction..."
          rows="4"
        />

        <div className="comment-form-row">
          <label className="timestamp-toggle">
            <input
              type="checkbox"
              checked={attachTimestamp}
              onChange={(event) => setAttachTimestamp(event.target.checked)}
            />
            <span>Attach current timestamp ({formatTime(currentTime)})</span>
          </label>
          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post comment'}
          </button>
        </div>

        {error ? <p className="panel-notice panel-notice-error">{error}</p> : null}
      </form>

      <div className="comment-thread">
        {comments.map((comment) => (
          <article className="comment-item" key={comment.id}>
            <img src={comment.user.avatar} alt={comment.user.name} />
            <div className="comment-body">
              <div className="comment-meta">
                <strong>{comment.user.name}</strong>
                <span>{comment.user.handle}</span>
                <span>{formatDate(comment.created_at)}</span>
              </div>
              <p>{comment.text}</p>
              {typeof comment.timestamp_ms === 'number' ? (
                <button
                  className="timestamp-chip"
                  type="button"
                  onClick={() => onJumpToTime(comment.timestamp_ms / 1000)}
                >
                  {formatTime(comment.timestamp_ms / 1000)}
                </button>
              ) : (
                <span className="timestamp-chip timestamp-chip-muted">
                  General comment
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Comments
