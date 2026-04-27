import React, { useEffect, useState } from 'react';
import serviceLocator from '../utils/serviceLocator';
import PulsifyAdminLayout from '../components/admin/PulsifyAdminLayout';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchMetrics = async () => {
      try {
        // Assume getAnalytics is part of moderationService
        if (serviceLocator.moderation.getAnalytics) {
          const res = await serviceLocator.moderation.getAnalytics();
          if (active) setMetrics(res.data || res);
        } else {
          // Placeholder if mock doesn't have getAnalytics yet
          if (active) {
            setMetrics({
              total_active_users: 12543,
              play_through_rate: 0.72,
              total_storage_bytes: 5432100000000,
              new_users_this_month: 830,
              suspended_users_count: 42,
              pending_reports_count: 15,
              plan_distribution: { Free: 12000, Artist: 400, ArtistPro: 143 }
            });
          }
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load metrics');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchMetrics();
    return () => { active = false; };
  }, []);

  if (isLoading) return <PulsifyAdminLayout><div className="pulsify-admin-loading">Loading metrics...</div></PulsifyAdminLayout>;
  if (error) return <PulsifyAdminLayout><div className="pulsify-admin-error">Error: {error}</div></PulsifyAdminLayout>;

  return (
    <PulsifyAdminLayout>
      <div className="pulsify-admin-dashboard" data-testid="admin-dashboard-page">
        <h2 className="pulsify-admin-title">Platform Health Metrics</h2>
        
        <div className="pulsify-metrics-grid">
          <div className="pulsify-metric-card" data-testid="metric-active-users">
            <h3>Active Users (30d)</h3>
            <div className="pulsify-metric-value">{metrics?.total_active_users?.toLocaleString() || 0}</div>
          </div>
          
          <div className="pulsify-metric-card" data-testid="metric-play-rate">
            <h3>Play-Through Rate</h3>
            <div className="pulsify-metric-value">{((metrics?.play_through_rate || 0) * 100).toFixed(1)}%</div>
          </div>
          
          <div className="pulsify-metric-card" data-testid="metric-reports">
            <h3>Pending Reports</h3>
            <div className="pulsify-metric-value pulsify-alert-text">{metrics?.pending_reports_count || 0}</div>
          </div>

          <div className="pulsify-metric-card" data-testid="metric-suspended">
            <h3>Suspended Accounts</h3>
            <div className="pulsify-metric-value">{metrics?.suspended_users_count || 0}</div>
          </div>
        </div>

        {/* Dummy Chart Section simulating SoundCloud style dark mode analytics */}
        <div className="pulsify-admin-charts">
          <div className="pulsify-chart-panel" data-testid="chart-plan-distribution">
            <h3>Plan Distribution</h3>
            <div className="pulsify-bar-chart">
              <div className="pulsify-bar" style={{ height: '80%' }}><span className="label">Free</span></div>
              <div className="pulsify-bar" style={{ height: '30%' }}><span className="label">Artist</span></div>
              <div className="pulsify-bar" style={{ height: '15%' }}><span className="label">Pro</span></div>
            </div>
          </div>
          
          <div className="pulsify-chart-panel" data-testid="chart-storage-usage">
            <h3>Storage Usage</h3>
            <div className="pulsify-storage-info">
              <h1>{((metrics?.total_storage_bytes || 0) / 1000000000).toFixed(2)} GB</h1>
              <p>Total data across all tracks</p>
            </div>
            <div className="pulsify-progress-container">
              <div className="pulsify-progress-fill" style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </PulsifyAdminLayout>
  );
};

export default AdminDashboardPage;
