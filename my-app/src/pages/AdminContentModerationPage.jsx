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
        <div className="sc-mod-content-wrapper">
          <div className="sc-mod-player-header" style={{ marginBottom: '20px' }}>
            <div className="sc-mod-player-top" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div className="sc-mod-title-wrapper">
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>Content Moderation & Reports</h1>
              </div>
            </div>
            
            <div className="sc-mod-not-found-banner" style={{ background: '#1c1c1c', padding: '15px', borderRadius: '8px', marginTop: '15px', border: '1px solid #333' }}>
              {reports.length === 0 ? (
                <span style={{ color: '#ccc' }}>No {statusFilter.toLowerCase()} reports found in the inbox.</span>
              ) : (
                <span style={{ color: '#ccc' }}>You have <strong style={{ color: 'white'}}>{reports.length}</strong> {statusFilter.toLowerCase()} reports needing review.</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
             <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px', cursor: 'pointer', outline: 'none' }}
              >
                <option value="Pending">Pending Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
          </div>

          {loading ? (
             <div className="sc-mod-empty-text" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Loading reports...</div>
          ) : reports.length === 0 ? (
             <div className="sc-mod-empty-text" style={{ padding: '40px', textAlign: 'center', background: '#111', borderRadius: '8px', color: '#888', border: '1px dashed #333' }}>
                No {statusFilter.toLowerCase()} reports found.
            </div>
          ) : (
            <div className="sc-mod-reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {reports.map((report) => (
                <div 
                  key={report._id} 
                  className="sc-mod-report-card" 
                  onClick={() => openModal(report)}
                  data-testid={eport-card- + report._id}
                  style={{ background: '#1a1a1a', padding: '20px', borderRadius: '8px', border: '1px solid #333', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ background: '#444', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: 'white', textTransform: 'uppercase' }}>{report.entity_type}</span>
                     <span style={{ color: '#888', fontSize: '12px' }}>{new Date(report.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <h4 className="sc-mod-info-title" style={{ fontSize: '18px', margin: '5px 0', color: 'white' }}>{report.reason}</h4>
                  <p style={{ color: '#aaa', fontSize: '14px', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>{report.description || 'No additional description provided.'}</p>
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #333', color: '#888', fontSize: '13px' }}>
                    Reported by: <span style={{ color: 'white' }}>{report.reporter_id?.username || 'Unknown'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

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
      </div>
    </PulsifyAdminLayout>
  );
};

export default AdminContentModerationPage;
