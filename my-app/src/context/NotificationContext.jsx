import React, { createContext, useState, useEffect, useCallback } from "react";
import serviceLocator from "../utils/serviceLocator";

// Observer Pattern: broadcasts notification state updates app-wide
export const NotificationContext = createContext();

const POLLING_INTERVAL = 30000; // 30 seconds

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from DI service
  const loadNotifications = useCallback(async () => {
    try {
      const data = await serviceLocator.notifications.fetchNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  // Initial fetch + polling interval (simulates push notifications)
  useEffect(() => {
    const token =
      localStorage.getItem("pulsify_access_token") ||
      localStorage.getItem("pulsify_jwt_token");

    if (!token) return;

    loadNotifications();
    const interval = setInterval(loadNotifications, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const markAsRead = async (id) => {
    try {
      await serviceLocator.notifications.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await serviceLocator.notifications.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllRead,
        loadNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
