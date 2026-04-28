import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyAdminLayout from '../components/admin/PulsifyAdminLayout';
import './AdminContentModerationPage.css';

const AdminContentModerationPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await serviceLocator.moderation.getReports({ status: statusFilter });
      let fetched = res.data?.reports || res.reports || res.data;
      if (!Array.isArray(fetched)) fetched = fetched?.items || fetched?.data || Object.values(fetched || {}).find(Array.isArray) || [];
      setReports(Array.isArray(fetched) ? fetched : []);
    } catch (err) {
      console.error(err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (status) => {
    if (!selectedReport) return;
    setActionLoading(true);
    try {
      await serviceLocator.moderation.resolveReport(selectedReport._id, status, resolveNotes);
      setSelectedReport(null);
      setResolveNotes('');
      fetchReports();
    } catch (err) {
      console.error('Failed to resolve report', err);
      alert('Failed to resolve report');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (report) => {
    setSelectedReport(report);
    setResolveNotes('');
  };

  return (
    <PulsifyAdminLayout>
      <div className="pulsify-admin-users" data-testid="admin-moderation-page">
        <div className="pulsify-page-header">
          <h2 className="pulsify-admin-title">Content Moderation & Reports</h2>
          <div className="pulsify-filter-actions">
            <div className="pulsify-filter-group">
              <label>Status: </label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="Pending">Pending Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pulsify-data-table-container">
          <table className="pulsify-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Reported By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">Loading reports...</td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">No {statusFilter} reports found.</td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id}>
                    <td className="text-gray-400">
                      {new Date(report.createdAt || Date.now()).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="pulsify-badge" style={{ backgroundColor: '#444' }}>
                        {report.entity_type}
                      </span>
                    </td>
                    <td className="font-bold">{report.reason}</td>
                    <td className="text-gray-400">
                      {report.reporter_id?.username || report.reporter_id?.name || 'Unknown'}
                    </td>
                    <td>
                      <span className={`pulsify-badge ${report.status === 'Resolved' ? 'pulsify-badge-success' : report.status === 'Dismissed' ? 'pulsify-badge-danger' : ''}`} style={report.status === 'Pending' ? { backgroundColor: '#f39c12' } : {}}>
                        {report.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="pulsify-btn-small"
                        onClick={() => openModal(report)}
                        style={{ backgroundColor: '#333' }}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {selectedReport && (
          <div className="sc-modal-overlay" onClick={() => setSelectedReport(null)} style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex: 1050 }}>
            <div className="sc-modal-content" onClick={e => e.stopPropagation()} style={{ background: '#1e1e1e', padding: '30px', borderRadius: '12px', width: '500px', maxWidth: '90%', border: '1px solid #333' }}>
              <div className="sc-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: 'white', fontSize: '20px' }}>Resolve Report</h3>
                <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', color: '#888', fontSize: '28px', cursor: 'pointer', padding: 0, lineHeight: 1 }}>x</button>
              </div>
              <div className="sc-modal-body" style={{ color: '#ccc', fontSize: '15px' }}>
                <div style={{ background: '#111', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #222' }}>
                  <p style={{ margin: '0 0 10px 0' }}><strong style={{ color: '#888', display: 'inline-block', width: '90px' }}>Type:</strong> <span style={{ color: 'white' }}>{selectedReport.entity_type}</span></p>
                  <p style={{ margin: '0 0 10px 0' }}><strong style={{ color: '#888', display: 'inline-block', width: '90px' }}>Reason:</strong> <span style={{ color: 'white' }}>{selectedReport.reason}</span></p>
                  <p style={{ margin: '0' }}><strong style={{ color: '#888', display: 'inline-block', width: '90px', verticalAlign: 'top' }}>Details:</strong> <span style={{ color: 'white', display: 'inline-block', width: 'calc(100% - 95px)' }}>{selectedReport.description || 'N/A'}</span></p>
                </div>
                
                <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>Moderator Notes (Optional)</label>
                <textarea
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  placeholder="Enter notes about the action taken..."
                  rows="3"
                  style={{ width: '100%', padding: '12px', background: '#121212', color: 'white', border: '1px solid #333', borderRadius: '6px', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                ></textarea>
              </div>
              <div className="sc-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #333' }}>
                <button onClick={() => setSelectedReport(null)} disabled={actionLoading} style={{ padding: '10px 20px', background: 'transparent', color: '#aaa', border: '1px solid #444', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                <button onClick={() => handleResolve('Resolved')} disabled={actionLoading} style={{ padding: '10px 20px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>{actionLoading ? 'Processing...' : 'Confirm Violation'}</button>
                <button onClick={() => handleResolve('Dismissed')} disabled={actionLoading} style={{ padding: '10px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>{actionLoading ? 'Processing...' : 'Dismiss Report'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PulsifyAdminLayout>
  );
};

export default AdminContentModerationPage;
