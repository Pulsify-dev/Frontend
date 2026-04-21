import React from 'react';
import { NavLink } from 'react-router-dom';
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
            <li><NavLink to="/admin" end className={({ isActive }) => isActive ? "active" : ""}>Dashboard</NavLink></li>
            <li><NavLink to="/admin/moderation" className={({ isActive }) => isActive ? "active" : ""}>Content Moderation</NavLink></li>
            <li><NavLink to="/admin/users" className={({ isActive }) => isActive ? "active" : ""}>User Management</NavLink></li>
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
