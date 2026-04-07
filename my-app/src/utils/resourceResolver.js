// Resource Resolver: Converts standard Pulsify permalinks into internal resource IDs
// Module 8 requirement: resolve standard permalinks (URLs) into internal resource IDs

const PULSIFY_DOMAIN = 'pulsify.com';

// Parses a Pulsify permalink URL and returns the resource type and ID
const resolvePermalink = (url) => {
  try {
    const parsed = new URL(url);

    // Validate domain
    if (!parsed.hostname.includes(PULSIFY_DOMAIN) && !parsed.hostname.includes('localhost')) {
      return { error: 'Invalid domain', resolved: false };
    }

    const pathParts = parsed.pathname.split('/').filter(Boolean);

    if (pathParts.length === 0) {
      return { type: 'home', id: null, resolved: true, path: '/' };
    }

    // /tracks/:id
    if (pathParts[0] === 'tracks' && pathParts[1]) {
      return { type: 'track', id: pathParts[1], resolved: true, path: `/tracks/${pathParts[1]}` };
    }

    // /users/:id or /users/:id/tracks
    if (pathParts[0] === 'users' && pathParts[1]) {
      const subResource = pathParts[2] || null;
      return { type: 'user', id: pathParts[1], subResource, resolved: true, path: parsed.pathname };
    }

    // /playlists/:id
    if (pathParts[0] === 'playlists' && pathParts[1]) {
      return { type: 'playlist', id: pathParts[1], resolved: true, path: `/playlists/${pathParts[1]}` };
    }

    // /search?q=term
    if (pathParts[0] === 'search') {
      const query = parsed.searchParams.get('q') || '';
      return { type: 'search', query, resolved: true, path: `/search?q=${query}` };
    }

    // /discover or /trending
    if (pathParts[0] === 'discover' || pathParts[0] === 'trending') {
      return { type: pathParts[0], id: null, resolved: true, path: parsed.pathname };
    }

    // Unrecognized path - treat as user profile (SoundCloud convention: /:username)
    return { type: 'user', id: pathParts[0], resolved: true, path: `/${pathParts[0]}` };

  } catch (err) {
    return { error: 'Invalid URL format', resolved: false };
  }
};

export default resolvePermalink;
