import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyAdminLayout from '../components/admin/PulsifyAdminLayout';
import './AdminUserManagementPage.css'; // Reusing the same grid/table styles

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <PulsifyAdminLayout>
          <div style={{ padding: '20px', color: 'red', backgroundColor: '#222' }}>
            <h2>Something went wrong in Tracks Management.</h2>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </div>
        </PulsifyAdminLayout>
      );
    }
    return this.props.children;
  }
}

const AdminTracksManagementPageContent = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTracks();
  }, [statusFilter]);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const res = await serviceLocator.moderation.getTracksAdmin({ status: statusFilter, search: searchQuery });
      let fetched = res.data?.tracks || res.tracks || res.data;
      if (!Array.isArray(fetched)) fetched = fetched?.items || fetched?.data || Object.values(fetched || {}).find(Array.isArray) || [];
      setTracks(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error(err);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTracks();
  };

  const handleBlockToggle = async (track) => {
    setActionLoading(true);
    const trackId = track?._id || track?.id;
    const isCurrentlyBlocked = track?.playback_state === 'blocked' || track?.is_blocked;
    try {
      if (isCurrentlyBlocked) {
        if (serviceLocator.moderation.unblockTrack) await serviceLocator.moderation.unblockTrack(trackId);
      } else {
        if (serviceLocator.moderation.blockTrack) await serviceLocator.moderation.blockTrack(trackId);
      }
      // Refresh list after success
      fetchTracks();
    } catch (err) {
      alert(`Failed to ${isCurrentlyBlocked ? 'unblock' : 'block'} track. Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTrack = async (track) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${track?.title || track?.name}"?`)) return;
    setActionLoading(true);
    const trackId = track?._id || track?.id;
    try {
      if (serviceLocator.moderation.deleteTrackAdmin) await serviceLocator.moderation.deleteTrackAdmin(trackId);
      fetchTracks();
    } catch (err) {
      alert(`Failed to delete track. Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PulsifyAdminLayout>
      <div className="pulsify-admin-users" data-testid="admin-tracks-page">
        <div className="pulsify-page-header">
          <h2 className="pulsify-admin-title">Tracks Management</h2>
          <div className="pulsify-filter-actions">
            <form onSubmit={handleSearchSubmit} className="pulsify-search-form">
              <input 
                type="text" 
                placeholder="Search tracks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="pulsify-btn-small">Search</button>
            </form>

            <div className="pulsify-filter-group">
              <label>Status: </label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Tracks</option>
                <option value="blocked">Blocked</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pulsify-data-table-container">
          <table className="pulsify-data-table">
            <thead>
              <tr>
                <th>Track ID</th>
                <th>Title</th>
                <th>Artist ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">Loading tracks...</td>
                </tr>
              ) : tracks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">No tracks found.</td>
                </tr>
              ) : (
                tracks.map((track, index) => {
                  if (!track) return null;
                  return (
                  <tr key={track?._id || track?.id || index} data-testid={`track-row-${track?._id || track?.id}`}>
                    <td className="text-gray-400">{track?._id || track?.id || 'N/A'}</td>
                    <td className="font-bold">{track?.title || track?.name || 'Unknown Track'}</td>
                    <td className="text-gray-400">
                      {typeof track?.artist_id === 'object' ? track.artist_id.username || track.artist_id.name : 
                       typeof track?.artist === 'object' ? track.artist.name :
                       track?.artistId || track?.artist_id || 'Unknown Artist'}
                    </td>
                    <td>
                      <span className={`pulsify-badge ${track?.playback_state === 'blocked' || track?.is_blocked ? 'pulsify-badge-danger' : 'pulsify-badge-success'}`}>
                        {track?.playback_state === 'blocked' || track?.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={`pulsify-btn-small ${track?.playback_state === 'blocked' || track?.is_blocked ? 'pulsify-btn-success' : 'pulsify-btn-danger'}`}
                        onClick={() => handleBlockToggle(track)}
                        disabled={actionLoading}
                      >
                        {track?.playback_state === 'blocked' || track?.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        className="pulsify-btn-small pulsify-btn-danger"
                        onClick={() => handleDeleteTrack(track)}
                        disabled={actionLoading}
                        style={{ backgroundColor: '#dc3545' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PulsifyAdminLayout>
  );
};

const AdminTracksManagementPage = () => (
  <ErrorBoundary>
    <AdminTracksManagementPageContent />
  </ErrorBoundary>
);

export default AdminTracksManagementPage;
