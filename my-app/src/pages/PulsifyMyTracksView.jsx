import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PulsifyTrackService } from '../services/pulsifyTrackService';
import { PulsifyPlaylistService } from '../services/pulsifyPlaylistService';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../hooks/usePlayer';
import '../components/upload/css/PulsifyMyTracks.css';

export const PulsifyMyTracksView = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { togglePlay, isPlaying, currentTrack } = usePlayer();
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [visibilityFilter, setVisibilityFilter] = useState('all');

  const [playlistSidebarOpen, setPlaylistSidebarOpen] = useState(false);
  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState(null);
  const [hoveredTrack, setHoveredTrack] = useState(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const fetchTracks = useCallback(async () => {
    try {
      setLoading(true);
      const userId = user?._id || user?.id;
      const result = await PulsifyTrackService.getArtistTracks(userId || 'me', 1, 100);
      setTracks(result.tracks || []);
    } catch (err) {
      setError(err.message || 'Failed to load tracks.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPlaylists = useCallback(async () => {
    try {
      const res = await PulsifyPlaylistService.getMyPlaylists();
      if (res && res.data) {
        setPlaylists(res.data);
      }
    } catch (e) {
      console.error('Failed to load playlists', e);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
    fetchPlaylists();
  }, [fetchTracks, fetchPlaylists]);

  const handleDelete = async (trackId) => {
    try {
      await PulsifyTrackService.deleteTrack(trackId);
      setTracks(prev => prev.filter(t => t._id !== trackId));
      setActiveMenu(null);
    } catch (err) {
      alert('Failed to delete track: ' + err.message);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    if (!selectedTrackForPlaylist) return;
    try {
      const trackId = selectedTrackForPlaylist._id || selectedTrackForPlaylist.id;
      await PulsifyPlaylistService.addTrackToPlaylist(playlistId, trackId);
      alert('Added to playlist!');
      setPlaylistSidebarOpen(false);
    } catch (e) {
      alert('Failed to add track: ' + e.message);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !selectedTrackForPlaylist) return;
    try {
      setIsCreatingPlaylist(true);
      const newPlaylist = await PulsifyPlaylistService.createPlaylist({
        title: newPlaylistName,
        visibility: 'public'
      });
      
      const playlistId = newPlaylist.data?._id || newPlaylist._id;
      if (!playlistId) throw new Error("Could not retrieve new playlist ID from server response.");
      
      await PulsifyPlaylistService.addTrackToPlaylist(playlistId, selectedTrackForPlaylist._id);
      alert('Playlist created and track added!');
      setNewPlaylistName('');
      setIsCreatingPlaylist(false);
      fetchPlaylists();
      setPlaylistSidebarOpen(false);
    } catch (e) {
      setIsCreatingPlaylist(false);
      alert('Error creating playlist: ' + e.message);
    }
  };

  const openPlaylistSidebar = (track) => {
    setSelectedTrackForPlaylist(track);
    setPlaylistSidebarOpen(true);
    setActiveMenu(null);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.track-menu-container') && !e.target.closest('.track-menu-trigger')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredTracks = tracks.filter(t => {
    if (visibilityFilter === 'all') return true;
    return t.visibility === visibilityFilter;
  });

  return (
    <div className="artist-dashboard">
      {/* Custom Studio Navbar */}
      <div className="studio-top-nav">
        <div className="studio-nav-left">
          <Link to="/" className="studio-logo">
            <svg viewBox="0 0 48 48" fill="currentColor" width="32" height="32">
              <path d="M34.9,20.2c-0.2-6.5-5.5-11.8-12.1-11.8c-5.6,0-10.4,3.8-11.8,9C10.3,17.2,9.3,18.8,9,20.8c-3.4,0.6-6,3.6-6,7.1 c0,4,3.2,7.2,7.2,7.2h25.4c3.6,0,6.5-2.9,6.5-6.5C42.1,23.3,38.8,20.3,34.9,20.2z"/>
            </svg>
          </Link>
        </div>
        <div className="studio-nav-right">
          <div className="search-input-wrapper">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
             <input type="text" placeholder="Search" />
          </div>
          <Link to="/upload" className="studio-nav-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Upload
          </Link>
          <button className="studio-icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </button>
          <button className="studio-icon-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </button>
          <div className="studio-profile">
            <img src={user?.avatar_url || 'https://placehold.co/40?text=U'} alt="Profile" />
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Left Sidebar Menu */}
        <div className="dashboard-sidebar">
          <Link to="/" className="sidebar-btn" title="Home">
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M11.532 2.414a.75.75 0 0 1 .936 0l8.5 6.789a.75.75 0 0 1 .282.586V21a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1-.75-.75v-4.5a1.75 1.75 0 1 0-3.5 0V21a.75.75 0 0 1-.75.75h-6a.75.75 0 0 1-.75-.75V9.789a.75.75 0 0 1 .282-.586l8.5-6.789ZM4.25 10.15v10.1h4.5V16.5a3.25 3.25 0 0 1 6.5 0v3.75h4.5v-10.1L12 3.96l-7.75 6.19Z"></path></svg>
          </Link>
          <Link to="/feed" className="sidebar-btn" title="Feed">
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M15.75 3.25h-7.5v1.5h7.5v-1.5ZM6.25 6.25h11.5v1.5H6.25v-1.5ZM4.25 10A.75.75 0 0 1 5 9.25h14a.75.75 0 0 1 .75.75v10a.75.75 0 0 1-.75.75H5a.75.75 0 0 1-.75-.75V10Zm1.5.75v8.5h12.5v-8.5H5.75Z"></path></svg>
          </Link>
          <Link to="/library" className="sidebar-btn" title="Library">
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M3.25 4A.75.75 0 0 1 4 3.25h3a.75.75 0 0 1 .75.75v16a.75.75 0 0 1-.75.75H4a.75.75 0 0 1-.75-.75V4Zm1.5.75v14.5h1.5V4.75h-1.5ZM9.75 4a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75v16a.75.75 0 0 1-.75.75h-3a.75.75 0 0 1-.75-.75V4Zm1.5.75v14.5h1.5V4.75h-1.5ZM15.563 6.834a.75.75 0 0 0-.53.919l3.364 12.557a.75.75 0 0 0 .919.53l2.898-.776a.75.75 0 0 0 .53-.919L19.379 6.588a.75.75 0 0 0-.918-.53l-2.898.776Zm4.09 12.363L16.675 8.09l1.449-.388L21.1 18.809l-1.449.388Z"></path></svg>
          </Link>
          <Link to="/for-artists" className="sidebar-btn active" title="For artists">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" fillRule="evenodd" d="M14.176.784a.75.75 0 0 0-1.352 0l-2.283 4.753-5.225.702a.75.75 0 0 0-.418 1.286l3.814 3.64-.946 5.186a.75.75 0 0 0 1.094.795l4.64-2.503 4.64 2.503a.75.75 0 0 0 1.094-.795l-.946-5.186 3.814-3.64a.75.75 0 0 0-.418-1.286l-5.225-.702L14.176.784Zm-2.458 5.767L13.5 2.84l1.782 3.71a.75.75 0 0 0 .576.418l4.079.549-2.978 2.841a.75.75 0 0 0-.22.677l.74 4.049-3.623-1.954a.75.75 0 0 0-.712 0l-3.622 1.954.739-4.049a.75.75 0 0 0-.22-.677L7.063 7.518l4.079-.549a.75.75 0 0 0 .576-.418Z" clipRule="evenodd"></path><path fill="currentColor" d="M4.428 12.267.939 15.756 2 16.816l3.488-3.488-1.06-1.06ZM13.21 17.756 8.073 22.89l1.061 1.06 5.135-5.135-1.06-1.06ZM4.507 19.323l2.06-2.06 1.061 1.06-2.06 2.06-1.061-1.06Z"></path></svg>
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="dashboard-content">
          {/* Top Status Bar */}
          <div className="studio-status-bar">
            <div className="status-progress">
              <svg fill="none" viewBox="0 0 24 24" height="24" width="24" className="l652k2i l652k2f" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M9 19.5H6.75a5.25 5.25 0 1 1 1.3-10.34"></path><path d="M7.5 12A7.5 7.5 0 1 1 21 16.5"></path><path d="M11.07 15.18 14.25 12l3.18 3.18m-3.18 4.32V12"></path></g></svg>
              <span className="status-text-light">2% of uploads used</span>
              <div className="progress-bar-container"><div className="progress-bar-fill" style={{width: '2%'}}></div></div>
              <span className="status-text-light">5 of 180 minutes</span>
            </div>
            <Link to="/premium" className="btn-outline-white">Get unlimited uploads</Link>
          </div>

          {/* Artist Studio Panel */}
          <div className="artist-studio-panel">
            <div className="panel-header">
              <h2>Artist Studio</h2>
              <span className="stats-updated">All time stats updated daily.</span>
            </div>
            <div className="stats-row">
              <div className="stat-item"><div className="stat-num">{tracks.reduce((sum, t) => sum + (t.play_count || 0), 0)}</div><div className="stat-label">SC plays</div></div>
              <div className="stat-item"><div className="stat-num">{tracks.reduce((sum, t) => sum + (t.repost_count || 0), 0)}</div><div className="stat-label">Reposts</div></div>
              <div className="stat-item"><div className="stat-num">0</div><div className="stat-label">Downloads</div></div>
              <div className="stat-item"><div className="stat-num">{tracks.reduce((sum, t) => sum + (t.like_count || 0), 0)}</div><div className="stat-label">Likes</div></div>
              <div className="stat-item"><div className="stat-num">0</div><div className="stat-label">Comments</div></div>
              <div className="stat-item divider"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg><div className="stat-label">Insights</div></div>
              <div className="stat-item divider"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-1h-1c-.55 0-1-.45-1-1v-3c0-.55.45-1 1-1h3v-1h-3V8h2V7h2v1h1c.55 0 1 .45 1 1v3c0 .55-.45 1-1 1h-3v1h3v2h-2v1z"/></svg><div className="stat-label">Earnings</div></div>
              <div className="stat-item divider"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg><div className="stat-label">Fans</div></div>
              <div className="stat-item divider"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg><div className="stat-label">Benefits</div></div>
            </div>
            
            <div className="panel-tabs">
              <div className="tab active">SoundCloud Tracks</div>
              <div className="tab">Distribution</div>
              <div className="tab">Vinyl Records</div>
              <div className="tab">Comments</div>
              <div className="tab">Benefits</div>
            </div>
          </div>

          {/* Action Row */}
          <div className="action-row">
            <div className="buttons-group">
              <button className="btn-dark" onClick={() => navigate('/upload')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Upload or drop tracks
              </button>
              <button className="btn-dark">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                Distribute tracks
              </button>
              <button className="btn-dark">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Monetize tracks
              </button>
              <button className="btn-dark">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5v14M7 9v6M22 10v4M2 11v2"/></svg>
                Master track audio
              </button>
            </div>
          </div>

          {/* Filter Row */}
          <div className="filter-row">
            <div className="search-group">
              <div className="search-input-wrapper">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
                <input type="text" placeholder="Search tracks" />
              </div>
              <button 
                className={`pill-btn ${visibilityFilter === 'all' ? 'active' : ''}`}
                onClick={() => setVisibilityFilter('all')}
              >All</button>
              <button 
                className={`pill-btn ${visibilityFilter === 'public' ? 'active' : ''}`}
                onClick={() => setVisibilityFilter('public')}
              >Public</button>
              <button 
                className={`pill-btn ${visibilityFilter === 'private' ? 'active' : ''}`}
                onClick={() => setVisibilityFilter('private')}
              >Private</button>
            </div>
            <div className="sort-group">
              <span className="track-count">{filteredTracks.length} tracks</span>

              <button className="sort-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                Date
              </button>
            </div>
          </div>

          {/* Tracks Table */}
          <div className="tracks-table">
            <div className="table-header">
              <div className="col-checkbox"><input type="checkbox" /></div>
              <div className="col-track">TRACKS</div>
              <div className="col-duration">DURATION</div>
              <div className="col-date">DATE</div>
              <div className="col-engagements">ENGAGEMENTS</div>
              <div className="col-plays">PLAYS</div>
              <div className="col-actions"></div>
            </div>

            {loading ? (
              <div className="table-loading">Loading tracks...</div>
            ) : filteredTracks.length === 0 ? (
              <div className="table-empty">No tracks found.</div>
            ) : (
              <div className="table-body">
                {filteredTracks.map(track => (
                  <div 
                    key={track._id} 
                    className={`table-row ${hoveredTrack === track._id ? 'hovered' : ''}`}
                    onMouseEnter={() => setHoveredTrack(track._id)}
                    onMouseLeave={() => setHoveredTrack(null)}
                  >
                    <div className="col-checkbox"><input type="checkbox" /></div>
                    <div className="col-track">
                      <div className="track-art-box" onClick={() => togglePlay(track)}>
                        <img src={track.artwork_url || 'https://placehold.co/40x40/222/555?text=♪'} alt="" />
                        <div className={`art-play-overlay ${isPlaying && currentTrack?._id === track._id ? 'visible' : ''}`}>
                          {isPlaying && currentTrack?._id === track._id ? (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                          ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                          )}
                        </div>
                      </div>
                      <div className="track-details">
                        <Link to={`/tracks/${track._id}`} className="track-title-txt">{track.title}</Link>
                        <span className="track-artist-txt">{track.artist?.username || user?.username || 'iOmz'}</span>
                      </div>
                    </div>
                    <div className="col-duration">{formatDuration(track.duration)}</div>
                    <div className="col-date">{formatDate(track.createdAt)}</div>
                    
                    <div className="col-engagements">
                      <span className="engagement-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> -</span>
                      <span className="engagement-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> -</span>
                      <span className="engagement-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg> -</span>
                      <span className="engagement-item"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> -</span>
                    </div>
                    <div className="col-plays">
                      <strong>0</strong>
                    </div>
                    
                    <div className="col-actions">
                      <button className="btn-amplify">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Amplify
                      </button>
                      <div className="menu-wrapper">
                        <button 
                          className="btn-dots track-menu-trigger" 
                          onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === track._id ? null : track._id); }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                        </button>
                        
                        {activeMenu === track._id && (
                          <div className="track-menu-container">
                            <div className="menu-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</div>
                            <div className="menu-item" onClick={() => openPlaylistSidebar(track)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> 
                              Add to playlist
                            </div>
                            <div className="menu-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Monetize</div>
                            <div className="menu-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5v14M7 9v6M22 10v4M2 11v2"/></svg> Master</div>
                            <div className="menu-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Distribute</div>
                            <div className="menu-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Track insights</div>
                            <div className="menu-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download file</div>
                            <div 
                              className="menu-item" 
                              onClick={() => {
                                const isPrivate = track.is_private || track.visibility === 'private';
                                const tokenQuery = (isPrivate && track.secret_token) ? `?token=${track.secret_token}` : '';
                                const url = `${window.location.origin}/tracks/${track._id}${tokenQuery}`;
                                navigator.clipboard.writeText(url);
                                alert("Link copied to clipboard!");
                                setActiveMenu(null);
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> 
                              Copy link
                            </div>
                            <div className="menu-divider"></div>
                            <div className="menu-item text-danger" onClick={() => handleDelete(track._id)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> 
                              Delete track
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar: Add to Playlist */}
      <div className={`playlist-sidebar-overlay ${playlistSidebarOpen ? 'open' : ''}`} onClick={() => setPlaylistSidebarOpen(false)}>
        <div className={`playlist-sidebar ${playlistSidebarOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="sidebar-header">
            <button className="btn-close" onClick={() => setPlaylistSidebarOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
            <h3>Add to playlist</h3>
          </div>
          
          <div className="sidebar-content">
            <div className="create-playlist-btn" onClick={() => {
              const name = prompt('Playlist name:');
              if (name) setNewPlaylistName(name);
            }}>
              <div className="plus-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
              <span>Create playlist</span>
            </div>
            
            {newPlaylistName && (
              <div className="new-playlist-prompt">
                <button onClick={handleCreatePlaylist} disabled={isCreatingPlaylist}>
                  {isCreatingPlaylist ? 'Creating...' : `Create + Add: "${newPlaylistName}"`}
                </button>
                <button onClick={() => setNewPlaylistName('')}>Cancel</button>
              </div>
            )}

            <div className="playlists-list">
              {playlists.map(pl => (
                <div key={pl._id} className="playlist-item">
                  <img src={pl.artwork_url || pl.cover_url || 'https://placehold.co/48x48/111/333?text=PL'} alt="" />
                  <div className="playlist-info">
                    <span className="pl-title">{pl.title}</span>
                    <span className="pl-tracks">{pl.tracks?.length || 0} tracks</span>
                  </div>
                  <button className="btn-add-pl" onClick={() => handleAddToPlaylist(pl._id || pl.id)}>
                    Add to playlist
                  </button>
                </div>
              ))}
              {playlists.length === 0 && <div className="no-playlists">No playlists found. Create one above!</div>}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
