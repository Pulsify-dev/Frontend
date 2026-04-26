import { Link } from "react-router-dom";

const buildEntityPath = (sharedEntity) => {
  if (!sharedEntity?.id) return "#";
  const normalizedType = String(sharedEntity.type ?? "").toLowerCase();
  if (normalizedType === "playlist") return `/playlists/${sharedEntity.id}`;
  if (normalizedType === "album") return `/albums/${sharedEntity.id}`;
  return `/tracks/${sharedEntity.id}`;
};

const getEntityLabel = (sharedEntity) => {
  if (!sharedEntity?.type) return "Shared";
  const normalizedType = String(sharedEntity.type).toLowerCase();
  if (normalizedType === "playlist") return "Playlist";
  if (normalizedType === "album") return "Album";
  return "Track";
};

const SharedEntityCard = ({ sharedEntity }) => {
  if (!sharedEntity?.id) return null;

  const hasImage = sharedEntity.imageUrl || sharedEntity.coverArt || sharedEntity.thumbnail;
  const title = sharedEntity.title || sharedEntity.name;
  const subtitle = sharedEntity.subtitle || sharedEntity.artist;
  const imageUrl = sharedEntity.imageUrl || sharedEntity.coverArt || sharedEntity.thumbnail;

  return (
    <Link className="messages-shared-card" to={buildEntityPath(sharedEntity)}>
      {hasImage ? (
        <div className="messages-shared-image-wrapper">
          <img
            className="messages-shared-image"
            src={imageUrl}
            alt={title || getEntityLabel(sharedEntity)}
          />
          <div className="messages-shared-type-badge">{getEntityLabel(sharedEntity)}</div>
        </div>
      ) : (
        <div className="messages-shared-image-placeholder">
          <span className="messages-shared-type-badge">{getEntityLabel(sharedEntity)}</span>
        </div>
      )}
      <div className="messages-shared-content">
        {title ? (
          <strong className="messages-shared-title">{title}</strong>
        ) : (
          <strong className="messages-shared-id">{sharedEntity.id}</strong>
        )}
        {subtitle ? (
          <span className="messages-shared-subtitle">{subtitle}</span>
        ) : null}
      </div>
      <span className="messages-shared-link">View {getEntityLabel(sharedEntity).toLowerCase()}</span>
    </Link>
  );
};

export default SharedEntityCard;