import React from 'react';
import './PulsifyAdminLayout.css';

const PulsifyAdminLayout = ({ children }) => {
  return (
    <div className="pulsify-admin-layout">
      {/* Admin Sidebar */}
      <aside className="pulsify-admin-sidebar">
        <div className="pulsify-admin-logo">
          <h2>Pulsify Admin</h2>
        </div>
        <nav className="pulsify-admin-nav">
          <ul>
            <li className="active">Dashboard</li>
            <li>Reports Inbox</li>
            <li>Content Moderation</li>
            <li>User Management</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="pulsify-admin-content">
        <header className="pulsify-admin-header">
          <h1>Platform Health</h1>
          <div className="pulsify-admin-profile">Admin</div>
        </header>
        <div className="pulsify-admin-page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default PulsifyAdminLayout;
