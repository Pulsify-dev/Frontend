import { io } from "socket.io-client";

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '').replace('/api', '');
  }
  return "http://localhost:3000";
};

const SOCKET_URL = getSocketUrl();

let socket = null;
let initializedToken = "";

const ensureSocket = (token) => {
  const authToken = String(token ?? "").trim();

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
      auth: { token: `Bearer ${authToken}` },
    });
    initializedToken = authToken;
    return socket;
  }

  if (initializedToken !== authToken) {
    socket.auth = { token: `Bearer ${authToken}` };
    initializedToken = authToken;
  }

  return socket;
};

export const connectMessagingSocket = ({ token }) => {
  const client = ensureSocket(token);

  if (!client.connected) {
    client.connect();
  }

  return client;
};

export const disconnectMessagingSocket = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
  initializedToken = "";
};

export const getMessagingSocket = () => socket;

export const joinConversationRoom = (conversationId) => {
  if (!socket || !socket.connected || !conversationId) {
    return Promise.resolve({ success: false });
  }

  return new Promise((resolve) => {
    socket.emit("conversation:join", { conversation_id: conversationId }, (ack) => {
      resolve(ack ?? { success: false });
    });
  });
};

export const emitConversationRead = (conversationId) => {
  if (!socket || !socket.connected || !conversationId) {
    return Promise.resolve({ success: false });
  }

  return new Promise((resolve) => {
    socket.emit("conversation:read", { conversation_id: conversationId }, (ack) => {
      resolve(ack ?? { success: false });
    });
  });
};

export const emitMessageNew = ({ conversationId, text, sharedEntity }) => {
  if (!socket || !socket.connected || !conversationId) {
    return Promise.resolve({ success: false, error: "Socket not connected" });
  }

  const payload = {
    conversation_id: conversationId,
  };

  const trimmedText = String(text ?? "").trim();
  if (trimmedText) payload.text = trimmedText;

  if (sharedEntity?.id && sharedEntity?.type) {
    payload.shared_entity = {
      type:
        String(sharedEntity.type).toLowerCase() === "playlist"
          ? "Playlist"
          : String(sharedEntity.type).toLowerCase() === "album"
            ? "Album"
            : "Track",
      id: sharedEntity.id,
    };
  }

  return new Promise((resolve) => {
    socket.emit("message:new", payload, (ack) => {
      resolve(ack ?? { success: false });
    });
  });
};

export const subscribeSocketEvent = (eventName, handler) => {
  if (!socket || typeof handler !== "function") return () => {};

  socket.off(eventName, handler);
  socket.on(eventName, handler);

  return () => {
    if (!socket) return;
    socket.off(eventName, handler);
  };
};
