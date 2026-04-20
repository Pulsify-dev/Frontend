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
      setReports(res.data.reports || []);
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
      <div className="sc-admin-moderation-container" data-testid="admin-moderation-page">
        {/* SoundCloud Error Page Lookalike Header */}
        <div className="sc-mod-player-header">
          <div className="sc-mod-player-top">
            <button className="sc-mod-play-btn" disabled>
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <div className="sc-mod-title-wrapper">
              <h1>Content Moderation & Reports</h1>
            </div>
          </div>
          
          <div className="sc-mod-not-found-banner">
            <span className="icon">x</span>
            {reports.length === 0 ? (
              <span>No {statusFilter.toLowerCase()} reports found in the inbox. <a href="#">Learn more</a></span>
            ) : (
              <span>You have {reports.length} {statusFilter.toLowerCase()} reports needing review. <a href="#">Learn more</a></span>
            )}
          </div>
        </div>

        {/* Trending-like Grid for Reports */}
        <div className="sc-mod-filters">
          <h2>Trending reports on Pulsify</h2>
          <select 
            className="sc-mod-select"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
          </select>
        </div>

        {loading ? (
          <div className="sc-mod-empty-text">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="sc-mod-empty-text">No {statusFilter.toLowerCase()} reports found.</div>
        ) : (
          <div className="sc-mod-reports-grid">
            {reports.map((report) => (
              <div 
                key={report._id} 
                className="sc-mod-report-card" 
                onClick={() => openModal(report)}
                data-testid={eport-card-+report._id}
              >
                <div className="sc-mod-art-box">
                  <img src={report.entity_type === 'Track' ? 'https://picsum.photos/seed/'+report._id+'/200' : 'https://picsum.photos/seed/'+report._id+'/200'} alt="Report art" />
                  <span className="sc-mod-overlay-badge">{report.entity_type}</span>
                </div>
                <h4 className="sc-mod-info-title">{report.reason}</h4>
                <p className="sc-mod-info-subtitle">Reported by {report.reporter_id?.username || 'Unknown'}</p>
              </div>
            ))}
          </div>
        )}

        {/* Resolution Modal */}
        {selectedReport && (
          <div className="sc-modal-overlay" onClick={() => setSelectedReport(null)}>
            <div className="sc-modal-content" onClick={e => e.stopPropagation()}>
              <div className="sc-modal-header">
                <h3>Resolve Report ({selectedReport._id.slice(-6)})</h3>
                <button className="sc-btn" style={{border:'none', background:'none', fontSize:'16px'}} onClick={() => setSelectedReport(null)}>×</button>
              </div>
              <div className="sc-modal-body">
                <p><strong>Entity Type:</strong> {selectedReport.entity_type}</p>
                <p><strong>Reason:</strong> {selectedReport.reason}</p>
                <p><strong>Description:</strong> {selectedReport.description}</p>
                
                <textarea
                  className="sc-textarea"
                  value={resolveNotes}
                  onChange={e => setResolveNotes(e.target.value)}
                  placeholder="Enter moderation notes..."
                  rows="3"
                ></textarea>
              </div>
              <div className="sc-modal-footer">
                <button
                  className="sc-btn"
                  onClick={() => setSelectedReport(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className="sc-btn sc-btn-danger"
                  onClick={() => handleResolve('Resolved')}
                  disabled={actionLoading}
                >
                  Confirm Violation
                </button>
                <button
                  className="sc-btn sc-btn-primary"
                  onClick={() => handleResolve('Dismissed')}
                  disabled={actionLoading}
                >
                  Dismiss Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PulsifyAdminLayout>
  );
};

export default AdminContentModerationPage;
