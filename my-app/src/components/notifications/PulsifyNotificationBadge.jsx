import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import PulsifyNotificationList from './PulsifyNotificationList';
import './PulsifyNotificationBadge.css';

const PulsifyNotificationBadge = () => {
  const { unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sc-notif-wrapper" data-testid="notification-badge-wrapper">
      <button
        className="sc-notif-bell"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="notification-trigger"
        title="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="sc-notif-count" data-testid="notification-unread-count">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="sc-notif-dropdown-backdrop" onClick={() => setIsOpen(false)}>
          <div className="sc-notif-dropdown" onClick={(e) => e.stopPropagation()}>
            <PulsifyNotificationList onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PulsifyNotificationBadge;
