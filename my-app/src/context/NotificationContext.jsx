import React, { createContext, useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import serviceLocator from "../utils/serviceLocator";

// Observer Pattern: broadcasts notification state updates app-wide
export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from DI service
  const loadNotifications = useCallback(async () => {
    try {
      const data = await serviceLocator.notifications.fetchNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read && !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  // Initial fetch and real-time Socket.IO setup
  useEffect(() => {
    const token =
      localStorage.getItem("pulsify_access_token") ||
      localStorage.getItem("pulsify_jwt_token") ||
      localStorage.getItem("token"); // Handle common token keys

    if (!token) return;

    loadNotifications();

    // 1. Establish socket connection
    const socket = io("http://localhost:3000", {
      auth: { token },
      // Fallback for query param (as tested in Postman sometimes)
      query: { token }
    });

    socket.on("connect", () => {
      console.log("Connected to notification web socket");
      // 2. Join the notification room after connecting
      socket.emit("join_notifications");
    });

    // 3. Listen for new notifications
    socket.on("new_notification", (notification) => {
      console.log("New real-time notification:", notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      socket.emit("leave_notifications");
      socket.disconnect();
    };
  }, [loadNotifications]);

  const markAsRead = async (id) => {
    try {
      await serviceLocator.notifications.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id || n.id === id ? { ...n, read: true, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await serviceLocator.notifications.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
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
