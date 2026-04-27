import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../hooks/usePlayer';
import serviceLocator from '../utils/serviceLocator';
import './DiscoveryFeedPage.css';

import ArtistToolsWidget from '../components/common/ArtistToolsWidget';
import ReportModal from '../components/common/ReportModal';
import { getListeningHistory } from '../services/api';

const DiscoveryFeedPage = () => {
  const navigate = useNavigate();
  const { togglePlay } = usePlayer();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportEntity, setReportEntity] = useState({ type: '', id: '' });
  const [loading, setLoading] = useState(true);

  // Data rows
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [freshUploads, setFreshUploads] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [followedUsers, setFollowedUsers] = useState(new Set());

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [
          recentData,
          playlistsData,
          trendingData,
          historyData,
          usersData,
        ] = await Promise.all([
          serviceLocator.discovery.getRecentlyPlayed(1, 10).catch(() => []),
          serviceLocator.discovery.discoverPlaylists(1, 10).catch(() => []),
          serviceLocator.discovery.fetchTrending(1, 10).catch(() => []),
          getListeningHistory().catch(() => ({ history: [] })),
          serviceLocator.discovery.getSuggestedUsers(5).catch(() => []),
        ]);

        setRecentlyPlayed(Array.isArray(recentData) ? recentData : []);
        setPlaylists(playlistsData || []);
        setTrendingTracks(trendingData || []);
        setHistory(historyData?.history || []);
        setSuggestedUsers(usersData || []);

        // Fresh uploads = trending tracks sorted by newest date
        const sorted = [...(trendingData || [])].sort(
          (a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0)
        );
        setFreshUploads(sorted.slice(0, 10));
      } catch (err) {
        console.error("Failed to load discover data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  const handleOpenReport = (type, id) => {
    setReportEntity({ type, id });
    setReportModalOpen(true);
  };

  const handlePlayTrack = (track) => {
    const t = track.track_id || track;
    togglePlay({
      trackId: t._id || t.trackId || t.id,
      title: t.title,
      coverArt: t.artwork_url || t.coverArt,
      audioUrl: t.audio_url || t.audioUrl,
      artist: {
        name: t.artist_id?.display_name || t.artist_id?.username || t.artist?.name || 'Unknown',
      },
    });
  };

  // Navigate to track detail page
  const handleGoToTrack = (track) => {
    const t = track.track_id || track;
    const id = t._id || t.trackId || t.id;
    if (id) navigate(`/tracks/${id}`);
  };

  // Follow user via backend API
  const handleFollow = async (userId) => {
    try {
      await serviceLocator.discovery.followUser(userId);
      setFollowedUsers(prev => new Set(prev).add(userId));
    } catch (err) {
      // 409 = already following — treat as success
      if (err?.response?.status === 409) {
        setFollowedUsers(prev => new Set(prev).add(userId));
      } else {
        console.error("Follow failed:", err);
      }
    }
  };

  // Unfollow user
  const handleUnfollow = async (userId) => {
    try {
      await serviceLocator.discovery.unfollowUser(userId);
      setFollowedUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    } catch (err) {
      console.error("Unfollow failed:", err);
    }
  };

  // ──── Carousel Component ────
  const Carousel = ({ title, subtitle, children, viewAllLink }) => (
    <section className="sc-discover-shelf">
      <div className="sc-shelf-header">
        <div>
          <h2 className="sc-shelf-title">{title}</h2>
          {subtitle && <div className="sc-shelf-subtext">{subtitle}</div>}
        </div>
        {viewAllLink && <a href={viewAllLink} className="sc-shelf-viewall">View all</a>}
      </div>
      <div className="sc-carousel-row">
        {children}
      </div>
    </section>
  );

  // ──── Track Card ────
  const TrackCard = ({ track, onReport }) => {
    const art = track.artwork_url || track.coverArt || 'https://via.placeholder.com/180';
    const title = track.title;
    const artist = track.artist_id?.display_name || track.artist_id?.username || track.artist?.name || '';
    const id = track._id || track.trackId || track.id;

    return (
      <div className="sc-discover-card">
        <div className="sc-discover-card-art" onClick={() => handleGoToTrack(track)} style={{ cursor: 'pointer' }}>
          <img src={art} alt={title} />
          <button className="sc-discover-card-play" onClick={(e) => { e.stopPropagation(); handlePlayTrack(track); }}>▶</button>
          {onReport && (
            <button
              className="sc-discover-card-report"
              onClick={(e) => { e.stopPropagation(); onReport('Track', id); }}
              title="Report"
            >⚑</button>
          )}
        </div>
        <div className="sc-discover-card-title" onClick={() => handleGoToTrack(track)} style={{ cursor: 'pointer' }}>{title}</div>
        {artist && <div className="sc-discover-card-artist" onClick={() => {
          const id = track.artist_id?._id || track.artist?.id;
          if (id) navigate(`/profile/${id}`);
        }} style={{ cursor: 'pointer' }}>{artist}</div>}
      </div>
    );
  };

  return (
    <div className="sc-discover-page" data-testid="discovery-feed-page">
      <div className="sc-discover-content">

        {/* Main Content */}
        <div className="sc-discover-main">

          {/* Row 1 – More of what you like / Recently Played */}
          <Carousel title="More of what you like" subtitle="Recently played tracks">
            {loading ? (
              <div className="sc-carousel-placeholder">Loading...</div>
            ) : recentlyPlayed.length > 0 ? (
              recentlyPlayed.map((item, i) => {
                const track = item.track_id || item;
                return <TrackCard key={track._id || i} track={track} onReport={handleOpenReport} />;
              })
            ) : trendingTracks.length > 0 ? (
              trendingTracks.slice(0, 5).map((track, i) => (
                <TrackCard key={track.trackId || i} track={track} onReport={handleOpenReport} />
              ))
            ) : (
              <div className="sc-carousel-placeholder">No recent tracks found.</div>
            )}
          </Carousel>

          {/* Row 2 – Discover Playlists */}
          <Carousel title="Curated by Pulsify" subtitle="Public Playlists">
            {playlists.length > 0 ? (
              playlists.map(pl => (
                <div
                  className="sc-discover-card sc-discover-card-playlist"
                  key={pl._id}
                  onClick={() => navigate(`/playlists/${pl._id}`)}
                >
                  <div className="sc-discover-card-art">
                    <img src={pl.cover_url || 'https://via.placeholder.com/180'} alt={pl.title} />
                    <div className="sc-discover-card-curator">☁</div>
                  </div>
                  <div className="sc-discover-card-title">{pl.title}</div>
                  <div className="sc-discover-card-artist">{pl.track_count || 0} tracks</div>
                </div>
              ))
            ) : (
              <div className="sc-carousel-placeholder">No playlists found.</div>
            )}
          </Carousel>

          {/* Row 3 – Trending Tracks (Numbered List) */}
          <section className="sc-discover-shelf">
            <div className="sc-shelf-header">
              <div>
                <h2 className="sc-shelf-title">Trending on Pulsify</h2>
                <div className="sc-shelf-subtext">Top tracks by engagement</div>
              </div>
              <a href="/trending" className="sc-shelf-viewall">View all</a>
            </div>
            <div className="sc-trending-list">
              {trendingTracks.slice(0, 10).map((track, i) => (
                <div className="sc-trending-row" key={track.trackId || i}>
                  <span className="sc-trending-rank">{i + 1}</span>
                  <div className="sc-trending-art" onClick={() => handlePlayTrack(track)} style={{ cursor: 'pointer' }}>
                    <img src={track.coverArt || 'https://via.placeholder.com/48'} alt={track.title} />
                  </div>
                  <div className="sc-trending-info" onClick={() => handleGoToTrack(track)} style={{ cursor: 'pointer' }}>
                    <div className="sc-trending-track-title">{track.title}</div>
                    <div className="sc-trending-track-artist">{track.artist?.name || 'Unknown'}</div>
                  </div>
                  <div className="sc-trending-stats" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span>▶ {(track.plays || 0).toLocaleString()}</span>
                    <span>♥ {(track.likes || 0).toLocaleString()}</span>
                    <button 
                      className="sc-trending-report-btn"
                      onClick={(e) => { e.stopPropagation(); handleOpenReport('Track', track.trackId || track._id || track.id); }}
                      title="Report Track"
                      style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }}
                    >
                      ⚑
                    </button>
                  </div>
                </div>
              ))}
              {trendingTracks.length === 0 && (
                <div className="sc-carousel-placeholder">No trending tracks yet.</div>
              )}
            </div>
          </section>

          {/* Row 4 – Fresh Uploads */}
          {freshUploads.length > 0 && (
            <Carousel title="Fresh uploads" subtitle="Latest tracks on the platform">
              {freshUploads.map((track, i) => (
                <TrackCard key={track.trackId || i} track={track} onReport={handleOpenReport} />
              ))}
            </Carousel>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="sc-discover-sidebar">

          <ArtistToolsWidget />

          {/* Artists You Should Follow */}
          <div className="sc-sidebar-widget">
            <div className="sc-widget-header">
              <h3>ARTISTS YOU SHOULD FOLLOW</h3>
              <a href="#" className="sc-widget-header-link">Refresh list</a>
            </div>
            <div className="sc-follow-list">
              {suggestedUsers.map(user => {
                const userId = user._id || user.id;
                const isFollowed = followedUsers.has(userId);
                return (
                  <div className="sc-follow-row" key={userId}>
                    <img
                      className="sc-follow-avatar"
                      src={user.avatar_url || 'https://via.placeholder.com/40'}
                      alt={user.display_name || user.username}
                      onClick={() => navigate(`/profile/${user._id || user.id}`)}
                    />
                    <div className="sc-follow-info" onClick={() => navigate(`/profile/${user._id || user.id}`)}>
                      <div className="sc-follow-name">
                        {user.display_name || user.username}
                        {user.is_verified && <span className="sc-verified-dot">●</span>}
                      </div>
                      <div className="sc-follow-stats">
                        👤 {(user.followers_count || 0).toLocaleString()} · 🎵 {user.track_count || 0}
                      </div>
                    </div>
                    <button
                      className={`sc-follow-btn ${isFollowed ? 'sc-follow-btn-following' : ''}`}
                      onClick={() => isFollowed ? handleUnfollow(userId) : handleFollow(userId)}
                    >
                      {isFollowed ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Listening History */}
          <div className="sc-sidebar-widget">
            <div className="sc-widget-header">
              <h3>LISTENING HISTORY</h3>
              <a href="#" className="sc-widget-header-link">View all</a>
            </div>
            <div className="sc-list-items">
              {history.length > 0 ? (
                history.slice(0, 5).map((hist, i) => {
                  const track = hist.track_id || hist;
                  return (
                    <div className="sc-track-mini" key={hist._id || i} onClick={() => handleGoToTrack(track)} style={{ cursor: 'pointer' }}>
                      <img src={track.artwork_url || track.coverArt || 'https://via.placeholder.com/40'} alt={track.title} className="sc-track-mini-art" />
                      <div className="sc-track-info">
                        <div className="sc-track-uploader">{track.artist_id?.username || track.artist?.name || 'Unknown'}</div>
                        <div className="sc-track-title">{track.title}</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ color: '#888', padding: '10px 0', fontSize: '13px' }}>No listening history available.</div>
              )}
            </div>
          </div>

          <div className="sc-sidebar-footer-links">
            <a href="#">Legal</a> · <a href="#">Privacy</a> · <a href="#">Cookie Policy/Imprint</a> · <a href="#">Charts</a> · <a href="#">Newsroom</a>
            <div className="sc-lang" style={{marginTop: '4px'}}>Language: <a href="#">English (US)</a></div>
          </div>
        </aside>
      </div>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        entityType={reportEntity.type}
        entityId={reportEntity.id}
      />
    </div>
  );
};

export default DiscoveryFeedPage;
