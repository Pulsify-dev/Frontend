import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyAdminLayout from '../components/admin/PulsifyAdminLayout';
import './AdminUserManagementPage.css';

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await serviceLocator.moderation.getUsers({ role: roleFilter, search: searchQuery });
      setUsers(res.data?.users || res.users || res.data || []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleSuspendToggle = async (user) => {
    setActionLoading(true);
    try {
      if (user.is_suspended) {
        await serviceLocator.moderation.restoreUser(user._id);
      } else {
        await serviceLocator.moderation.suspendUser(user._id);
      }
      fetchUsers(); // Refresh data
    } catch (err) {
      console.error('Failed to toggle suspend status', err);
      alert('Failed to update suspension status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(true);
    try {
      await serviceLocator.moderation.updateUserRole(userId, newRole);
      fetchUsers(); // Refresh data
    } catch (err) {
      console.error('Failed to change user role', err);
      alert('Failed to change user role');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PulsifyAdminLayout>
      <div className="pulsify-admin-users" data-testid="admin-users-page">
        <div className="pulsify-page-header">
          <h2 className="pulsify-admin-title">User Management</h2>
          <div className="pulsify-filter-actions">
            <form onSubmit={handleSearchSubmit} className="pulsify-search-form">
              <input 
                type="text" 
                placeholder="Search by username or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="pulsify-btn-small">Search</button>
            </form>

            <div className="pulsify-filter-group">
              <label>Role: </label>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="All">All Users</option>
                <option value="User">Standard</option>
                <option value="Artist">Artist</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pulsify-data-table-container">
          <table className="pulsify-data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">No users found.</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id} data-testid={`user-row-${user._id}`}>
                    <td className="font-bold">{user.username}</td>
                    <td className="text-gray-400">{user.email}</td>
                    <td>
                      <select 
                        className="pulsify-role-select"
                        value={user.role} 
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        disabled={actionLoading}
                      >
                        <option value="User">User</option>
                        <option value="Artist">Artist</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`pulsify-badge ${user.is_suspended ? 'pulsify-badge-danger' : 'pulsify-badge-success'}`}>
                        {user.is_suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`pulsify-btn-small ${user.is_suspended ? 'pulsify-btn-success' : 'pulsify-btn-danger'}`}
                        onClick={() => handleSuspendToggle(user)}
                        disabled={actionLoading}
                      >
                        {user.is_suspended ? 'Restore' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PulsifyAdminLayout>
  );
};

export default AdminUserManagementPage;