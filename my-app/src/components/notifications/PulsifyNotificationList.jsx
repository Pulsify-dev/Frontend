import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import './PulsifyNotificationList.css';

// Presentational dropdown list rendering individual notifications
const PulsifyNotificationList = ({ onClose }) => {
  const { notifications, markAsRead, markAllRead } = useNotifications();

  return (
    <div className="pulsify-glass-panel pulsify-notif-panel" data-testid="notification-list-panel">
      <div className="pulsify-notif-header">
        <h4>Recent Activity</h4>
        <button 
          className="pulsify-text-btn" 
          onClick={markAllRead}
          data-testid="notification-mark-all"
        >
          Mark all read
        </button>
      </div>
      
      <div className="pulsify-notif-items">
        {notifications.length === 0 ? (
          <p className="pulsify-empty-state">No new notifications</p>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`pulsify-notif-row ${n.read ? 'read' : 'unread'}`}
              onClick={() => markAsRead(n.id)}
              data-testid={`notification-item-${n.id}`}
            >
              <div className="pulsify-notif-dot" />
              <div className="pulsify-notif-content">
                <p>{n.message}</p>
                <small>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
              </div>
            </div>
          ))
        )}
      </div>
      <button className="pulsify-close-btn" onClick={onClose} data-testid="notification-close">Close Menu</button>
    </div>
  );
};

export default PulsifyNotificationList;
