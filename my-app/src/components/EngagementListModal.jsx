import { Link } from "react-router-dom";

const getInitialDataUri = (name, size = 56) => {
  const letter = (name ?? "?")[0].toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${size / 2}" fill="%23ff5500"/><text x="${size / 2}" y="${size * 0.65}" text-anchor="middle" font-size="${size * 0.4}" font-weight="700" font-family="sans-serif" fill="%23fff">${letter}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
};

const formatCount = (value) => {
  const numericValue = Number(value) || 0;

  if (numericValue >= 1000000) {
    return `${(numericValue / 1000000).toFixed(numericValue >= 10000000 ? 0 : 1)}M`;
  }

  if (numericValue >= 1000) {
    return `${Math.round(numericValue / 100) / 10}K`;
  }

  return `${numericValue}`;
};

function EngagementListModal({ title, description, variant, items }) {
  return (
    <section className="section-list-panel">
      <div className="section-list-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>

      <div className="section-list-grid">
        {items.map((item) => {
          if (variant === "tracks") {
            return (
              <Link
                className="section-list-row is-track"
                key={item.id}
                to={`/tracks/${item.id}`}
              >
                <img src={item.cover} alt={item.title} />
                <div>
                  <p>{item.artist}</p>
                  <strong>{item.title}</strong>
                  <span>
                    {formatCount(item.playCount)} plays ·{" "}
                    {formatCount(item.likeCount)} likes ·{" "}
                    {formatCount(item.commentCount)} comments
                  </span>
                </div>
              </Link>
            );
          }

          if (variant === "playlists") {
            return (
              <Link
                className="section-list-row is-playlist"
                key={item.id}
                to={`/playlists/${item.id}`}
              >
                <img src={item.cover} alt={item.title} />
                <div>
                  <p>{item.creatorName}</p>
                  <strong>{item.title}</strong>
                  <span>
                    {item.trackCount} tracks · {formatCount(item.likes)} likes
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <article className="section-list-row is-user" key={item.id}>
              <img
                src={item.avatar || getInitialDataUri(item.name)}
                alt={item.name}
                onError={(e) => {
                  e.currentTarget.src = getInitialDataUri(item.name);
                }}
              />
              <div>
                <strong>{item.name}</strong>
                <p>{item.handle}</p>
              </div>
              {"plays" in item ? <span>{item.plays} plays</span> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default EngagementListModal;
