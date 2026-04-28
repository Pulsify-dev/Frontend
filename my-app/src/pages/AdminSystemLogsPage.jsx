import React, { useState, useEffect } from 'react';
import serviceLocator from '../utils/serviceLocator';
import './AdminSystemLogsPage.css';

const AdminSystemLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('All');

  useEffect(() => {
    fetchLogs();
  }, [filterLevel]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await serviceLocator.moderation.getSystemLogs({ level: filterLevel });
      console.log("Logs Response:", response);
      setLogs(response.data?.logs || response.logs || response);
    } catch (error) {
      console.error('Failed to fetch system logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'pulsify-log-critical';
      case 'WARNING': return 'pulsify-log-warning';
      case 'INFO': return 'pulsify-log-info';
      default: return 'pulsify-log-default';
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  return (
    <div className="pulsify-system-logs">
      <header className="pulsify-logs-header">
        <h2>System Logs & Audit Trail</h2>
        <p>Monitor platform activity, security events, and administrative actions.</p>
        
        <div className="pulsify-logs-controls">
          <div className="pulsify-filter-group">
            <label>Filter by Level:</label>
            <select 
              value={filterLevel} 
              onChange={(e) => setFilterLevel(e.target.value)}
            >
              <option value="All">All Events</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <button className="pulsify-logs-refresh" onClick={fetchLogs}>
            Refresh Logs
          </button>
        </div>
      </header>

      <div className="pulsify-logs-container">
        {loading ? (
          <div className="pulsify-logs-loading">Loading audit trail...</div>
        ) : (!Array.isArray(logs) || logs.length === 0) ? (
          <div className="pulsify-logs-empty">No logs matched the selected criteria.</div>
        ) : (
          <table className="pulsify-logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Category</th>
                <th>Level</th>
                <th>Action</th>
                <th>User / Source</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id || log._id}>
                  <td className="pulsify-log-time">{formatDate(log.timestamp)}</td>
                  <td>{log.category}</td>
                  <td>
                    <span className={`pulsify-log-badge ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="pulsify-log-action">{log.action}</td>
                  <td>{log.user}</td>
                  <td className="pulsify-log-details">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminSystemLogsPage;