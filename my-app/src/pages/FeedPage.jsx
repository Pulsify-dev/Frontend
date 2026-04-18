import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyTrackRow from '../components/common/PulsifyTrackRow';
import './FeedPage.css';

// Container Pattern: SoundCloud "Stream" page
const FeedPage = () => {
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedTracks, setLikedTracks] = useState(new Set());
  const [repostedTracks, setRepostedTracks] = useState(new Set());

  useEffect(() => {
    let mounted = true;
    const loadFeed = async () => {
      try {
        const data = await serviceLocator.discovery.fetchFeed();
        if (mounted) { setFeedData(data); setLoading(false); }
      } catch (error) {
        console.error("DI fetchFeed error:", error);
        if (mounted) setLoading(false);
      }
    };
    loadFeed();
    return () => { mounted = false; };
  }, []);

  const handleLike = async (trackId) => {
    try {
      if (likedTracks.has(trackId)) {
        setLikedTracks(prev => { const n = new Set(prev); n.delete(trackId); return n; });
      } else {
        await serviceLocator.discovery.likeTrack(trackId);
        setLikedTracks(prev => new Set(prev).add(trackId));
      }
    } catch (e) { console.error("Like failed:", e); }
  };

  const handleRepost = async (trackId) => {
    try {
      if (repostedTracks.has(trackId)) {
        setRepostedTracks(prev => { const n = new Set(prev); n.delete(trackId); return n; });
      } else {
        await serviceLocator.discovery.repostTrack(trackId);
        setRepostedTracks(prev => new Set(prev).add(trackId));
      }
    } catch (e) { console.error("Repost failed:", e); }
  };

  return (
    <div className="sc-feed-page" data-testid="discovery-feed-page">
      <div className="sc-feed-content">
        <div className="sc-feed-main">
          <div className="sc-feed-header-row">
            <h2 className="sc-page-heading">Hear the latest posts from the people you're following:</h2>
            <div className="sc-reposts-toggle">
              <span>Reposts</span>
              <div className="sc-toggle-switch sc-toggle-on"></div>
            </div>
          </div>

          {loading ? (
            <div className="sc-loader" data-testid="feed-loading">
              <div className="sc-loader-bar"></div>
            </div>
          ) : feedData.length === 0 ? (
            <div className="sc-empty-state">
              <p className="sc-empty-text">
                Your feed is currently empty. Go to <a href="#search" className="sc-link-accent">search</a>, <a href="#home" className="sc-link-accent">home</a> or use the suggestions below to find creators to follow. Refresh the page to see tracks they are posting.
              </p>

              <div className="sc-artists-suggestions-header">
                <span className="sc-artists-title">ARTISTS YOU SHOULD FOLLOW</span>
                <button className="sc-refresh-btn">Refresh list</button>
              </div>

              <div className="sc-artists-list">
                {[
                  { name: "Someone'", f: '14.1K', t: '5', id: 1 },
                  { name: 'MegaALAlmy', f: '8,060', t: '16', id: 2 },
                  { name: 'Ali', f: '3,966', t: '12', id: 3 },
                  { name: 'Amr abosoliman', f: '2,779', t: '10', id: 4 },
                  { name: 'amrabdo', f: '5,939', t: '3', id: 5 },
                  { name: 'Walaa Mohey', f: '6,731', t: '13', id: 6 },
                  { name: 'Shady Azab', f: '1,631', t: '49', id: 7 },
                  { name: 'Crazy lifee', f: '2,486', t: '9', id: 8 },
                  { name: 'Hagar Ebrahim', f: '3,865', t: '6', id: 9 }
                ].map(artist => (
                  <div className="sc-artist-row" key={artist.id}>
                    <div className="sc-artist-avatar-placeholder"></div>
                    <div className="sc-artist-details">
                      <span className="sc-artist-name">{artist.name}</span>
                      <span className="sc-artist-stats">
                        <span className="sc-stat-item">👤 {artist.f}</span>
                        <span className="sc-stat-item">🎵 {artist.t}</span>
                      </span>
                    </div>
                    <button className="sc-btn sc-btn-follow">Follow</button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="sc-track-list" data-testid="feed-list">
              {feedData.map(track => (
                <PulsifyTrackRow
                  key={track.trackId}
                  track={track}
                  onLike={handleLike}
                  onRepost={handleRepost}
                  isLiked={likedTracks.has(track.trackId)}
                  isReposted={repostedTracks.has(track.trackId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="sc-feed-sidebar">
          <div className="sc-sidebar-section sc-artist-tools">
            <div className="sc-sidebar-heading">
              <span>ARTIST TOOLS</span>
            </div>
            <div className="sc-artist-tools-grid">
              <div className="sc-tool-box">
                <span className="sc-tool-icon">
                  <svg height="32" color="var(--mui-palette-primary-main)" fill="none" viewBox="0 0 32 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-darkreader-inline-color="" style={{ '--darkreader-inline-color': 'var(--darkreader-text--mui-palette-primary-main, var(--darkreader-text-000000, #e8e6e3))' }}>
                    <path d="M31.5104 19.7579L21.8869 15.4979L18.9112 0.474774C18.8479 0.149167 18.459 -0.113127 18.0972 0.0496763L9.25153 4.02931C9.10682 4.09262 8.98924 4.21925 8.93497 4.37301L0.17977 29.3271C0.0712341 29.6256 0.261171 29.9512 0.496332 30.0598L10.1198 34.3198L13.1317 49.5238C13.204 49.8946 13.602 50.1026 13.9457 49.9489L22.7913 45.9693C22.9089 45.915 23.0627 45.7612 23.1079 45.6256L31.8179 20.4815C31.9174 20.1921 31.7817 19.8755 31.5013 19.7489L31.5104 19.7579ZM9.95701 5.00613L17.3284 1.68675L9.11586 25.1033L1.74449 28.4227L9.95701 5.00613ZM9.58618 26.1887L18.052 29.9331L10.6444 33.2706L2.17863 29.5261L9.58618 26.1887ZM11.3137 34.2565L19.065 30.7652L21.8959 45.0919L14.1447 48.5832L11.3137 34.2565Z" fill="currentColor"></path>
                  </svg>
                </span>
                <span className="sc-tool-label">Amplify</span>
              </div>
              <div className="sc-tool-box">
                <span className="sc-tool-icon">
                  <svg height="32" color="var(--mui-palette-primary-main)" fill="none" viewBox="0 0 57 61" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-darkreader-inline-color="" style={{ '--darkreader-inline-color': 'var(--darkreader-text--mui-palette-primary-main, var(--darkreader-text-000000, #e8e6e3))' }}>
                    <path d="m56.348 45.255-.03-8.78c0-.3-.21-.56-.5-.63l-5.4-1.25a.73.73 0 0 0-.55.13l-6.03 5a.65.65 0 0 0-.24.5v3.76l-18.81-4.34 3.85-3.04c.14-.11.22-.26.24-.44a.65.65 0 0 0-.14-.48l-3.82-4.76a.65.65 0 0 0-.91-.1l-9.89 7.81-.03.03h-.01l-6.03 5c-1.09.91-1.12 2.66-.05 3.98l9.96 12.39c.11.14.27.22.44.24h.07c.15 0 .3-.05.42-.15l6.02-4.99 2.21-1.75 14.9 3.44c.81.19 1.57 0 2.11-.45l5.69-4.72h.03c.15 0 .3-.05.42-.15l5.28-4.38c.01-.01.02-.02.03-.04.52-.45.81-1.1.8-1.85l-.03.02Zm-5.39 1.77 2.08.48-2.08 1.72v-2.2Zm-6.07-6.49 4.73-3.93.03 8.78-4.76-1.1v-3.75Zm-26.34 18.17-9.54-11.87c-.61-.75-.67-1.73-.13-2.17l4.4-3.65c.1.61.42 1.23.75 1.63l9.56 11.89-5.03 4.17h-.01Zm24.73-3.32c-.25.21-.6.27-.99.18l-13.88-3.2.29-.23c.14-.11.22-.26.24-.44a.638.638 0 0 0-.14-.48l-3.78-4.7 22.64 5.23-4.38 3.64Z" fill="currentColor"></path>
                  </svg>
                </span>
                <span className="sc-tool-label">Replace</span>
              </div>
              <div className="sc-tool-box">
                <span className="sc-tool-icon">
                  <svg height="32" color="var(--mui-palette-primary-main)" fill="none" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-darkreader-inline-color="" style={{ '--darkreader-inline-color': 'var(--darkreader-text--mui-palette-primary-main, var(--darkreader-text-000000, #e8e6e3))' }}>
                    <path d="M29.624.942c-16.16 0-29.26 13.1-29.26 29.26 0 16.16 13.1 29.26 29.26 29.26 16.16 0 29.26-13.1 29.26-29.26 0-16.16-13.1-29.26-29.26-29.26Zm27.55 24.88h.07c.24 1.47.35 2.96.35 4.45-.23-1.48-.6-2.97-1.11-4.45h.7-.01Zm-9.67-16.91c2.93 2.25 4.94 4.76 6.66 7.92h-1.49v1.68a32.89 32.89 0 0 0-5.96-6.36c.5-1 .78-1.96.81-2.84 0-.14-.02-.27-.03-.4h.01Zm.68 12.42h-4.49v1.96c-1-1.45-2.07-2.85-3.19-4.19 2.5-2 4.38-3.96 5.56-5.8 2.62 2.18 4.88 4.74 6.62 7.56v.47h-4.5Zm4.45 4.49c-1.2 1.44-2.77 2.96-4.67 4.49h-.18c-.73-1.52-1.55-3.02-2.45-4.49h7.3Zm-18.58-22.12c4.33.41 8.37 1.83 11.82 4.07.25.44.38.93.36 1.5-.02.63-.22 1.33-.56 2.07a34.613 34.613 0 0 0-11.89-5.86c.25-.64.34-1.23.27-1.78Zm10.99 8.78c-1.1 1.74-2.94 3.67-5.39 5.62-2.87-3.27-6.08-6.14-9.38-8.35 1.27-1.06 2.25-2.11 2.89-3.1 4.33 1.12 8.39 3.15 11.87 5.83h.01Zm-36.36 19.09c1.11 0 2.3-.08 3.54-.24v3.48h4.49v-4.33l.25-.06c.95 4.45 2.34 8.89 4.11 12.92-3.83.93-7.39 1.38-10.37 1.23-1.75-4-2.63-8.48-2.68-13.02.22 0 .43.02.66.02Zm-.64-1.33c.12-4.39 1.02-8.79 2.72-12.81 1.41.04 3.06-.17 4.82-.57-.09 3.83.31 8.05 1.13 12.31-3.19.78-6.16 1.16-8.68 1.08l.01-.01Zm8.85-13.71c1.9-.52 3.89-1.25 5.83-2.14 1.67 3.16 3.53 6.83 5.42 10.68-3.37 1.57-6.85 2.86-10.17 3.76-.82-4.26-1.21-8.49-1.08-12.3Zm1.34 13.57c3.42-.92 7.01-2.25 10.48-3.87 1.98 4.06 3.97 8.28 5.8 12.29-4.04 1.89-8.2 3.42-12.16 4.48-1.78-4.02-3.18-8.46-4.12-12.9Zm5.66-16.27c1.91-.95 3.72-2.05 5.31-3.23 3.31 2.16 6.53 5.02 9.41 8.29-2.76 2.07-5.95 3.99-9.3 5.62-1.89-3.85-3.75-7.52-5.42-10.68Zm-15.1-2.27c2.57-2.87 5.73-5.21 9.35-6.84 3.39-1.53 6.98-2.36 10.6-2.47 1.36-.04 3.61.07 4.01 1.38.31 1.01-.56 3.02-3.92 5.64-.01 0-.02.02-.03.03-5.28 4.1-13.51 7.14-18.39 6.82-1.54-.11-2.54-.55-2.84-1.25-.32-.76.13-1.96 1.25-3.3l-.03-.01Zm-5.3 8.75c.72-1.91 1.64-3.71 2.73-5.38.04.16.08.3.13.43a29.866 29.866 0 0 0-3.02 5.39c.05-.15.1-.3.16-.44Zm3.71-3.88c.48.38 1.19.7 2.22.88-1.66 4.05-2.55 8.45-2.67 12.86-1.98-.22-3.43-.8-4.18-1.69-.02-.02-.03-.04-.04-.06.57-4.19 2.15-8.3 4.68-11.99h-.01Zm-2.83 25.64c-.14-.32-.27-.64-.4-.97 0-.05-.03-.09-.04-.14a.658.658 0 0 0-.13-.28c-1.26-3.4-1.73-7.03-1.45-10.66 1.03.76 2.5 1.24 4.38 1.44.03 4.5.88 8.96 2.52 12.98-2.45-.33-4.12-1.15-4.88-2.37Zm4 6.23c-.57-.65-1.12-1.32-1.62-2.02-.04-.05-.07-.1-.11-.16-.27-.39-.52-.81-.77-1.22 1 .44 2.29.78 3.97.93.4.86.84 1.68 1.3 2.47h-2.78.01Zm12.84 0h-8.54c-.48-.76-.93-1.56-1.34-2.39h.49c2.89 0 6.25-.5 9.79-1.38.62 1.34 1.27 2.6 1.94 3.77h-2.34Zm13.49 4.49h-4.49v-4.49h4.49v4.49Zm0-8.99h-8.99v4.49h-.66c-.74-1.25-1.46-2.63-2.16-4.1 3.85-1.05 7.89-2.53 11.8-4.33v3.94h.01Zm-4.82-18.13c3.45-1.69 6.74-3.65 9.58-5.79 1.53 1.82 2.95 3.75 4.22 5.74v.2h.12a48.85 48.85 0 0 1 2.53 4.49h-7.15v4.49h2.29c-1.86 1.12-3.8 2.18-5.8 3.16-1.83-4.01-3.82-8.23-5.8-12.3l.01.01Zm18.3 9.14v4.49h-11.89c-.02-.05-.05-.11-.07-.16 2.69-1.31 5.29-2.77 7.72-4.33h4.25v-.2c.02.07.05.14.07.2h-.08Zm8.38 0h-6.92c-.04-.11-.09-.23-.13-.34-.15-.42-.3-.84-.47-1.26-.08-.21-.18-.42-.26-.63-.13-.31-.25-.62-.39-.94 2.51-1.99 4.49-3.95 5.89-5.82h.8c1.1 3 1.59 6.04 1.48 8.99Z" fill="currentColor"></path>
                  </svg>
                </span>
                <span className="sc-tool-label">Distribute</span>
              </div>
              <div className="sc-tool-box">
                <span className="sc-tool-icon">🎛️</span>
                <span className="sc-tool-label">Master</span>
              </div>
            </div>
            <button className="sc-unlock-tools-btn">
              <span className="sc-unlock-icon">✨</span> Unlock Artist tools from EGP 29.99/month.
            </button>
          </div>

          <div className="sc-sidebar-section sc-likes-section">
            <div className="sc-sidebar-heading">
              <span>5 LIKES</span>
              <a href="#likes" className="sc-view-all">View all</a>
            </div>
            <div className="sc-like-item">
              <div className="sc-like-art"></div>
              <div className="sc-like-info">
                <span className="sc-like-artist">Someone'</span>
                <span className="sc-like-title">أديني رجعتلك - عمرو دياب 2001</span>
                <span className="sc-like-stats">▶ 44.7M ❤️ 1.01M</span>
              </div>
            </div>
            <div className="sc-like-item">
              <div className="sc-like-art"></div>
              <div className="sc-like-info">
                <span className="sc-like-artist">Roqaiaion2</span>
                <span className="sc-like-title">عمرو دياب - لو كان يرضيك</span>
                <span className="sc-like-stats">▶ 36.5M ❤️ 892K</span>
              </div>
            </div>
          </div>

          <div className="sc-sidebar-section sc-mobile-section">
            <div className="sc-sidebar-heading">
              <span>GO MOBILE</span>
            </div>
            <div className="sc-mobile-badges">
              <button className="sc-app-store-btn">App Store</button>
              <button className="sc-google-play-btn">Google Play</button>
            </div>
          </div>

          <div className="sc-sidebar-footer">
            <div className="sc-footer-links-row">
              <a href="#legal">Legal</a> <span>·</span> <a href="#privacy">Privacy</a> <span>·</span> <a href="#cookie">Cookie Policy</a> <span>·</span> <a href="#cookie-manager">Cookie Manager</a> <span>·</span> <a href="#imprint">Imprint</a> <span>·</span> <a href="#artist-resources">Artist Resources</a> <span>·</span> <a href="#newsroom">Newsroom</a> <span>·</span> <a href="#charts">Charts</a> <span>·</span> <a href="#transparency">Transparency Reports</a>
            </div>
            <div className="sc-footer-lang">Language: <a href="#lang">English (US)</a></div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default FeedPage;
