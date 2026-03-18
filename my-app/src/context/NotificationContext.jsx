import React, { createContext, useState, useEffect } from 'react';

// Observer Pattern target for broadcasting notification updates app-wide
export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // simulate receiving a notification shortly after mount to show it works
  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification({
        id: `notif-${Date.now()}`,
        type: 'like',
        message: 'Dr. Loop liked your track "Midnight Syntax"',
        read: false,
        timestamp: new Date().toISOString()
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const addNotification = (notif) => {
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1)); // defensive check
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
