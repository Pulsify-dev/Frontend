import React, { createContext, useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import serviceLocator from "../utils/serviceLocator";
import { adaptNotification } from "../services/notificationService";
import { readAuthToken } from "../services/api";

// Observer Pattern: broadcasts notification state updates app-wide
export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(
    Notification.permission === "granted",
  );

  // Fetch notifications from DI service
  const loadNotifications = useCallback(async () => {
    if (!readAuthToken()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

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
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
      "http://localhost:3000";
    const socket = io(socketUrl, {
      auth: { token },
      // Fallback for query param (as tested in Postman sometimes)
      query: { token },
    });

    socket.on("connect", () => {
      // 2. Join the notification room after connecting
      socket.emit("join_notifications");
    });

    // 3. Listen for new notifications
    socket.on("new_notification", (notification) => {
      const camelNotif = adaptNotification(notification);
      setNotifications((prev) => [camelNotif, ...prev]);
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
        prev.map((n) =>
          n._id === id || n.id === id ? { ...n, read: true, is_read: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await serviceLocator.notifications.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true, is_read: true })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const registerDeviceToken = async (fcmToken) => {
    try {
      await serviceLocator.notifications.registerPushToken(fcmToken);
    } catch (err) {
      console.error("Failed to register FCM token:", err);
    }
  };

  const requestBrowserNotifications = async () => {
    if (!("Notification" in window)) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushEnabled(true);
        // For production: generate an actual FCM token here before registering.
        // For local development, we send a mocked device string to the server.
        await registerDeviceToken("mock_fcm_desktop_token_" + Date.now());
        return true;
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
    return false;
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllRead,
        loadNotifications,
        registerDeviceToken,
        requestBrowserNotifications,
        pushEnabled,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
