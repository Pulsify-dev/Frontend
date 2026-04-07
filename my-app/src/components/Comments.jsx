import { useMemo, useState } from 'react'

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatRelativeDate = (value) => {
  const then = new Date(value)
  const now = new Date()
  const diffHours = Math.round((then.getTime() - now.getTime()) / (1000 * 60 * 60))

  if (Math.abs(diffHours) < 24) {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      diffHours,
      'hour',
    )
  }

  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.round(diffHours / 24),
    'day',
  )
}

function Comments({ comments, totalCount = comments.length, onJumpToTime, mode = 'overview' }) {
  const [sortOrder, setSortOrder] = useState(mode === 'page' ? 'newest' : 'timeline')

  const sortedComments = useMemo(() => {
    const nextComments = [...comments]

    if (sortOrder === 'newest') {
      return nextComments.sort(
        (left, right) => new Date(right.created_at) - new Date(left.created_at),
      )
    }

    return nextComments.sort((left, right) => {
      const leftTime = left.timestamp_ms ?? Number.MAX_SAFE_INTEGER
      const rightTime = right.timestamp_ms ?? Number.MAX_SAFE_INTEGER
      return leftTime - rightTime
    })
  }, [comments, sortOrder])

  return (
    <section className={`comments-panel ${mode === 'page' ? 'is-page' : ''}`}>
      <div className="comments-panel-head">
        <h2>{totalCount} comments</h2>
        <label className="sort-select">
          <span>Sorted by:</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="timeline">Timeline</option>
          </select>
        </label>
      </div>

      <div className="comment-thread">
        {sortedComments.map((comment) => (
          <article className="comment-row" key={comment.id}>
            <img src={comment.user.avatar} alt={comment.user.name} />
            <div className="comment-content">
              <div className="comment-meta">
                <strong>{comment.user.name}</strong>
                <span>
                  {typeof comment.timestamp_ms === 'number'
                    ? `at ${formatTime(comment.timestamp_ms / 1000)}`
                    : 'general comment'}
                </span>
                <span>{formatRelativeDate(comment.created_at)}</span>
              </div>

              <p>{comment.text}</p>

              <div className="comment-actions">
                <button className="comment-link" type="button">
                  Reply
                </button>
                {typeof comment.timestamp_ms === 'number' ? (
                  <button
                    className="comment-link"
                    type="button"
                    onClick={() => onJumpToTime(comment.timestamp_ms / 1000)}
                  >
                    Jump to {formatTime(comment.timestamp_ms / 1000)}
                  </button>
                ) : null}
              </div>
            </div>

            <button className="comment-count-pill" type="button">
              0
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Comments
