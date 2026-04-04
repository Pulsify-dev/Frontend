function EngagementListModal({ title, users, onClose }) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="section-heading">
          <div>
            <h2>{title}</h2>
            <p>Live engagement list from the track endpoint.</p>
          </div>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal-list">
          {users.map((user) => (
            <article className="modal-user" key={user.id}>
              <img src={user.avatar} alt={user.name} />
              <div>
                <strong>{user.name}</strong>
                <p>{user.handle}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}

export default EngagementListModal
