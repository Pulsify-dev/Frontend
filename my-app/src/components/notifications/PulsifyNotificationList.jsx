import React from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import './PulsifyNotificationList.css';

// Type-to-icon mapping for notification types
const TYPE_ICONS = {
  like: '♥',
  repost: '⇄',
  follow: '👤',
  comment: '💬'
};

const TYPE_COLORS = {
  like: '#f44',
  repost: '#3bc',
  follow: '#f50',
  comment: '#fc3'
};

// Format relative time
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const PulsifyNotificationList = ({ onClose }) => {
  const { notifications, markAsRead, markAllRead } = useNotifications();

  return (
    <div className="sc-notif-panel" data-testid="notification-list-panel">
      <div className="sc-notif-header">
        <h4>Notifications</h4>
        <button
          className="sc-notif-mark-all"
          onClick={markAllRead}
          data-testid="notification-mark-all"
        >
          Mark all as read
        </button>
      </div>

      <div className="sc-notif-items">
        {notifications.length === 0 ? (
          <div className="sc-notif-empty">No notifications yet</div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`sc-notif-item ${n.read ? 'read' : 'unread'}`}
              onClick={() => markAsRead(n.id)}
              data-testid={`notification-item-${n.id}`}
            >
              <div className="sc-notif-avatar">
                <img src={n.actorAvatar} alt={n.actorName} />
              </div>
              <div className="sc-notif-content">
                <p className="sc-notif-text">
                  <strong>{n.actorName}</strong> {n.message}
                  {n.targetTitle && <span className="sc-notif-target"> "{n.targetTitle}"</span>}
                </p>
                <span className="sc-notif-time">{timeAgo(n.createdAt)}</span>
              </div>
              <div className="sc-notif-type-icon" style={{ color: TYPE_COLORS[n.type] || '#999' }}>
                {TYPE_ICONS[n.type] || '•'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PulsifyNotificationList;
