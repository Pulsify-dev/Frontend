import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { NotificationContext } from "../context/NotificationContext";
import { useAuth } from "../contexts/AuthContext";
import "./NotificationsPage.css";

const NotificationsPage = () => {
  const { notifications, markAsRead, markAllRead, loadNotifications } = useContext(NotificationContext) || { notifications: [], markAsRead: () => {}, markAllRead: () => {}, loadNotifications: () => {} };
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Initial fetch to make sure data is fresh
    if (loadNotifications) loadNotifications();
  }, [loadNotifications]);

  // Handle marking read when clicked
  const handleNotifClick = (notif) => {
    if (!notif.read && !notif.is_read) {
      markAsRead(notif.id || notif._id);
    }
  };

  // Simplified relative time formatter
  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins || 1} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  return (
    <div className="notif-page-container">
      <div className="notif-page-content">
        
        {/* Left Column: Notifications */}
        <div className="notif-main-column">
          <div className="notif-header">
            <h2>Notifications</h2>
            <div className="notif-filter-dropdown">
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All notifications</option>
                <option value="unread">Unread</option>
              </select>
            </div>
          </div>

          <div className="notif-list">
            {!notifications || notifications.length === 0 ? (
              <div className="notif-empty-state">
                <p>No notifications yet.</p>
              </div>
            ) : (
              notifications.filter(n => filter === "unread" ? !(n.read || n.is_read) : true).map((notif) => {
                const isFollow = notif.type?.toUpperCase() === 'FOLLOW' || notif.action_type?.toUpperCase() === 'FOLLOW';
                
                return (
                  <div 
                    key={notif.id || notif._id} 
                    className={`notif-item ${!(notif.read || notif.is_read) ? 'unread' : ''}`}
                    onClick={() => handleNotifClick(notif)}
                  >
                    <div className="notif-avatar-wrapper">
                      {notif.actorAvatar || notif.actor_avatar || notif.actor_id?.avatar_url ? (
                        <img 
                          src={notif.actorAvatar || notif.actor_avatar || notif.actor_id?.avatar_url} 
                          alt="User Avatar" 
                          className="notif-avatar" 
                        />
                      ) : (
                        <div className="notif-avatar-fallback">
                          {(notif.actorName || notif.actor_name || notif.actor_id?.display_name || "U")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="notif-details">
                      <div className="notif-message-line">
                        <span className="notif-actor">{notif.actorName || notif.actor_name || notif.actor_id?.display_name || "Someone"}</span>
                        {' '}
                        <span className="notif-action-text">{notif.message || `performed a ${notif.type || notif.action_type || 'action'}`}{' '}</span>
                        {notif.targetTitle && <span className="notif-target">"{notif.targetTitle}"</span>}
                      </div>
                      <div className="notif-time">
                        <svg className="notif-time-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        {getRelativeTime(notif.createdAt || notif.created_at)}
                      </div>
                    </div>

                    <div className="notif-actions">
                      {isFollow && (
                        <button className="notif-follow-back-btn">Follow back</button>
                      )}
                      <button className="notif-more-btn" title="More options">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="12" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="19" cy="12" r="2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="notif-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <h3>RECENT FOLLOWERS</h3>
              <Link to="/followers" className="sidebar-view-all">View all</Link>
            </div>
            
            <div className="sidebar-followers-list">
              {/* Hardcoded mock followers based on the screenshot */}
              <div className="sidebar-follower-item">
                <img src={`https://ui-avatars.com/api/?name=MD&background=random`} alt="Follower" className="sidebar-follower-img" />
                <div className="sidebar-follower-info">
                  <div className="sidebar-follower-name">Mudollet Designer</div>
                  <div className="sidebar-follower-stats">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> 5
                  </div>
                </div>
                <button className="sidebar-follow-back">Follow back</button>
              </div>

              <div className="sidebar-follower-item">
                <img src={`https://ui-avatars.com/api/?name=RB&background=random`} alt="Follower" className="sidebar-follower-img" />
                <div className="sidebar-follower-info">
                  <div className="sidebar-follower-name">Rap Bangers Repost</div>
                  <div className="sidebar-follower-stats">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> 7,775
                  </div>
                </div>
                <button className="sidebar-follow-back">Follow back</button>
              </div>
            </div>
          </div>

          <div className="sidebar-footer">
            <p>
              <a href="/legal">Legal</a> &middot;{" "}
              <a href="/privacy">Privacy</a> &middot;{" "}
              <a href="/cookies">Cookie Policy</a> &middot;{" "}
              <a href="/cookie-manager">Cookie Manager</a> &middot;{" "}
              <a href="/imprint">Imprint</a> &middot;{" "}
              <a href="/artist-resources">Artist Resources</a> &middot;{" "}
              <a href="/newsroom">Newsroom</a> &middot;{" "}
              <a href="/charts">Charts</a> &middot;{" "}
              <a href="/transparency">Transparency Reports</a>
            </p>
            <p className="sidebar-language">Language: <a href="#en">English (US)</a></p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default NotificationsPage;