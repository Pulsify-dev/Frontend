import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyAdminLayout from '../components/admin/PulsifyAdminLayout';
import './AdminUserManagementPage.css'; // Reusing the same grid/table styles

const AdminAlbumsManagementPage = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAlbums();
  }, [statusFilter]);

  const fetchAlbums = async () => {
    setLoading(true);
    try {
      const res = await serviceLocator.moderation.getAlbumsAdmin({ status: statusFilter, search: searchQuery });
      let fetched = res.data?.albums || res.albums || res.data;
      if (!Array.isArray(fetched)) fetched = fetched?.items || fetched?.data || Object.values(fetched || {}).find(Array.isArray) || [];
      setAlbums(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error(err);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAlbums();
  };

  const handleHideToggle = async (album) => {
    setActionLoading(true);
    const albumId = album?._id || album?.id;
    const isCurrentlyHidden = album?.is_hidden;
    try {
      if (isCurrentlyHidden) {
        if (serviceLocator.moderation.unhideAlbum) await serviceLocator.moderation.unhideAlbum(albumId);
      } else {
        if (serviceLocator.moderation.hideAlbum) await serviceLocator.moderation.hideAlbum(albumId);
      }
      // Refresh list after success
      fetchAlbums();
    } catch (err) {
      alert(`Failed to ${isCurrentlyHidden ? 'unhide' : 'hide'} album. Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAlbum = async (album) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${album?.title || album?.name}"?`)) return;
    setActionLoading(true);
    const albumId = album?._id || album?.id;
    try {
      if (serviceLocator.moderation.deleteAlbumAdmin) await serviceLocator.moderation.deleteAlbumAdmin(albumId);
      fetchAlbums();
    } catch (err) {
      alert(`Failed to delete album. Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PulsifyAdminLayout>
      <div className="pulsify-admin-users" data-testid="admin-albums-page">
        <div className="pulsify-page-header">
          <h2 className="pulsify-admin-title">Albums Management</h2>
          <div className="pulsify-filter-actions">
            <form onSubmit={handleSearchSubmit} className="pulsify-search-form">
              <input 
                type="text" 
                placeholder="Search albums..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="pulsify-btn-small">Search</button>
            </form>

            <div className="pulsify-filter-group">
              <label>Status: </label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">All Albums</option>
                <option value="hidden">Hidden</option>
                <option value="active">Active</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pulsify-data-table-container">
          <table className="pulsify-data-table">
            <thead>
              <tr>
                <th>Album ID</th>
                <th>Title</th>
                <th>Artist ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">Loading albums...</td>
                </tr>
              ) : albums.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">No albums found.</td>
                </tr>
              ) : (
                albums.map((album, index) => {
                  if (!album) return null;
                  return (
                  <tr key={album?._id || album?.id || index} data-testid={`album-row-${album?._id || album?.id}`}>
                    <td className="text-gray-400">{album?._id || album?.id || 'N/A'}</td>
                    <td className="font-bold">{album?.title || album?.name || 'Unknown Album'}</td>
                    <td className="text-gray-400">
                      {typeof album?.artist_id === 'object' ? album.artist_id.username || album.artist_id.name : 
                       typeof album?.artist === 'object' ? album.artist.name :
                       album?.artistId || album?.artist_id || 'Unknown Artist'}
                    </td>
                    <td>
                      <span className={`pulsify-badge ${album?.is_hidden ? 'pulsify-badge-danger' : 'pulsify-badge-success'}`}>
                        {album?.is_hidden ? 'Hidden' : 'Visible'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={`pulsify-btn-small ${album?.is_hidden ? 'pulsify-btn-success' : 'pulsify-btn-danger'}`}
                        onClick={() => handleHideToggle(album)}
                        disabled={actionLoading}
                      >
                        {album?.is_hidden ? 'Unhide' : 'Hide'}
                      </button>
                      <button
                        className="pulsify-btn-small pulsify-btn-danger"
                        onClick={() => handleDeleteAlbum(album)}
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

export default AdminAlbumsManagementPage;
