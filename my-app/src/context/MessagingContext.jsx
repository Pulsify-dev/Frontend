import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { MessagingContext } from "@/context/messagingContextValue";
import serviceLocator from "@/utils/serviceLocator";
import { adaptMessage, createOptimisticMessage, sortMessagesByTime } from "@/messages/adapters/messagingAdapter";
import {
  connectMessagingSocket,
  disconnectMessagingSocket,
  emitConversationRead,
  emitMessageNew,
  joinConversationRoom,
  subscribeSocketEvent,
} from "@/services/messagingSocket";
import { readAuthToken, blockUser } from "@/services/api";
import { getBlockedUsersApi, getRelationshipApi } from "@/social/services/socialApi";
import { useAuth } from "@/contexts/AuthContext";

const EMPTY_MESSAGES = {};
const MAX_DEDUPE_IDS = 2000;

const readCurrentUserId = (authUser) => {
  if (authUser?.id) return authUser.id;
  if (authUser?.user_id) return authUser.user_id;

  try {
    const parsed = JSON.parse(localStorage.getItem("pulsify_user") || "null");
    if (parsed?.id) return parsed.id;
    if (parsed?.user_id) return parsed.user_id;
  } catch {
    return "";
  }

  return "";
};

const toConversationPreview = (message, fallbackConversation) => {
  if (!message) return fallbackConversation;

  const nextText = String(message.text ?? "").trim();
  const currentText = String(fallbackConversation?.lastMessageText ?? "").trim();

  return {
    ...fallbackConversation,
    lastMessageAt: message.createdAt,
    lastMessageText: nextText || currentText,
  };
};

const isBlockedState = (value) =>
  value === "i_blocked_them" || value === "they_blocked_me";

const resolveBlockedStatePriority = (...states) => {
  if (states.includes("i_blocked_them")) return "i_blocked_them";
  if (states.includes("they_blocked_me")) return "they_blocked_me";
  return "none";
};

export const MessagingProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messagesByConversationId, setMessagesByConversationId] = useState(EMPTY_MESSAGES);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [blockedUserIds, setBlockedUserIds] = useState(() => new Set());
  const [blockedStateByConversation, setBlockedStateByConversation] = useState({});
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [sendingError, setSendingError] = useState("");

  const dedupeRef = useRef(new Set());
  const cleanupListenersRef = useRef([]);
  const mountedRef = useRef(true);
  const knownConversationParticipantsRef = useRef({});
  const pendingReadRef = useRef(new Set());
  const pendingMessagesRef = useRef(new Set());
  const initialLoadDoneRef = useRef(false);

  const currentUserId = readCurrentUserId(user);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setConversations([]);
      setMessagesByConversationId(EMPTY_MESSAGES);
      setUnreadTotal(0);
      setActiveConversationId("");
      setIsLoadingConversations(false);
      setIsLoadingMessages(false);
      setConnectionStatus("idle");
      dedupeRef.current.clear();
      knownConversationParticipantsRef.current = {};
      pendingReadRef.current.clear();
      pendingMessagesRef.current.clear();
      initialLoadDoneRef.current = false;
    }
  }, [isAuthenticated, user?.id]);

  const rememberMessageId = useCallback((messageId) => {
    if (!messageId) return;
    dedupeRef.current.add(messageId);

    if (dedupeRef.current.size > MAX_DEDUPE_IDS) {
      const items = [...dedupeRef.current];
      const trimmed = items.slice(items.length - MAX_DEDUPE_IDS);
      dedupeRef.current = new Set(trimmed);
    }
  }, []);

  const hasSeenMessage = useCallback((messageId) => {
    if (!messageId) return false;
    return dedupeRef.current.has(messageId);
  }, []);

  const upsertConversation = useCallback((nextConversation) => {
    setConversations((prev) => {
      const index = prev.findIndex((item) => item.id === nextConversation.id);
      if (index === -1) {
        return [nextConversation, ...prev];
      }

      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        ...nextConversation,
      };

      return updated.sort((left, right) => {
        const leftTime = new Date(left.lastMessageAt ?? 0).getTime();
        const rightTime = new Date(right.lastMessageAt ?? 0).getTime();
        return rightTime - leftTime;
      });
    });
  }, []);

  const appendMessage = useCallback((messageInput) => {
    const normalized = adaptMessage(messageInput);

    if (normalized.id && hasSeenMessage(normalized.id)) {
      return;
    }

    if (normalized.id) {
      rememberMessageId(normalized.id);
    }

    setMessagesByConversationId((prev) => {
      const existing = prev[normalized.conversationId] ?? [];
      return {
        ...prev,
        [normalized.conversationId]: sortMessagesByTime([...existing, normalized]),
      };
    });

    setConversations((prev) => {
      const index = prev.findIndex((item) => item.id === normalized.conversationId);
      if (index === -1) return prev;

      const updated = [...prev];
      const existingConversation = updated[index];
      const isIncoming = normalized.senderId && normalized.senderId !== currentUserId;
      const isActive = normalized.conversationId === activeConversationId;

      updated[index] = {
        ...existingConversation,
        lastMessageAt: normalized.createdAt,
        lastMessageText: String(normalized.text ?? "").trim() || existingConversation.lastMessageText,
        unreadCount:
          isIncoming && !isActive
            ? Number(existingConversation.unreadCount ?? 0) + 1
            : Number(existingConversation.unreadCount ?? 0),
      };

      return updated.sort((left, right) => {
        const leftTime = new Date(left.lastMessageAt ?? 0).getTime();
        const rightTime = new Date(right.lastMessageAt ?? 0).getTime();
        return rightTime - leftTime;
      });
    });

    if (normalized.senderId && normalized.senderId !== currentUserId) {
      setUnreadTotal((prev) => prev + (normalized.conversationId === activeConversationId ? 0 : 1));
    }
  }, [activeConversationId, currentUserId, hasSeenMessage, rememberMessageId]);

  const reconcileOptimisticMessage = useCallback((conversationId, clientNonce, persistedMessage) => {
    const normalized = adaptMessage(persistedMessage);

    if (normalized.id) {
      rememberMessageId(normalized.id);
    }

    setMessagesByConversationId((prev) => {
      const existing = prev[conversationId] ?? [];
      const replaced = existing.map((item) => {
        if (item.clientNonce && item.clientNonce === clientNonce) {
          return {
            ...normalized,
            deliveryState: "sent",
            clientNonce,
          };
        }

        return item;
      });

      return {
        ...prev,
        [conversationId]: sortMessagesByTime(replaced),
      };
    });

    setConversations((prev) =>
      prev
        .map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          return {
            ...conversation,
            lastMessageAt: normalized.createdAt,
          };
        })
        .sort((left, right) => {
          const leftTime = new Date(left.lastMessageAt ?? 0).getTime();
          const rightTime = new Date(right.lastMessageAt ?? 0).getTime();
          return rightTime - leftTime;
        }),
    );
  }, [rememberMessageId]);

  const markOptimisticMessageFailed = useCallback((conversationId, clientNonce) => {
    setMessagesByConversationId((prev) => {
      const existing = prev[conversationId] ?? [];
      return {
        ...prev,
        [conversationId]: existing.map((item) =>
          item.clientNonce === clientNonce
            ? {
                ...item,
                deliveryState: "failed",
              }
            : item,
        ),
      };
    });
  }, []);

  const loadBlockedUsers = useCallback(async () => {
    if (!isAuthenticated) {
      setBlockedUserIds(new Set());
      return;
    }

    try {
      const response = await getBlockedUsersApi(1, 100);
      const ids = new Set((response.users ?? []).map((userItem) => userItem.id));
      if (mountedRef.current) {
        setBlockedUserIds(ids);
      }
    } catch {
      if (mountedRef.current) {
        setBlockedUserIds(new Set());
      }
    }
  }, [isAuthenticated]);

  const evaluateBlockedState = useCallback(async (conversation) => {
    const participantId = conversation?.otherParticipant?.id;
    if (!participantId) return "none";

    if (blockedUserIds.has(participantId)) return "i_blocked_them";

    try {
      const relationship = await getRelationshipApi(participantId);
      if (relationship?.isBlocked) {
        return "i_blocked_them";
      }
      if (relationship?.isBlockedBy) {
        return "they_blocked_me";
      }
      return "none";
    } catch {
      return "none";
    }
  }, [blockedUserIds]);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoadingConversations(true);
    try {
      const response = await serviceLocator.messaging.getConversations(1, 20);
      const normalizedConversations = response.conversations ?? [];

      const nextParticipants = {};
      normalizedConversations.forEach((conversation) => {
        nextParticipants[conversation.id] = conversation.otherParticipant?.id ?? "";
      });
      knownConversationParticipantsRef.current = nextParticipants;

      const nextBlockedStates = {};
      normalizedConversations.forEach((conversation) => {
        const resolvedState = resolveBlockedStatePriority(conversation.blockStatus);
        if (resolvedState !== "none") nextBlockedStates[conversation.id] = resolvedState;
      });
      setBlockedStateByConversation(nextBlockedStates);

      if (!mountedRef.current) return;

      setConversations(
        normalizedConversations.sort((left, right) => {
          const leftTime = new Date(left.lastMessageAt ?? 0).getTime();
          const rightTime = new Date(right.lastMessageAt ?? 0).getTime();
          return rightTime - leftTime;
        }),
      );

      setUnreadTotal(
        normalizedConversations.reduce(
          (sum, conversation) => sum + Number(conversation.unreadCount ?? 0),
          0,
        ),
      );
    } catch {
      if (mountedRef.current) {
        setConversations([]);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoadingConversations(false);
      }
    }
  }, [isAuthenticated]);

  const loadUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const count = await serviceLocator.messaging.getUnreadCount();
      if (mountedRef.current) {
        setUnreadTotal(Number(count ?? 0));
      }
    } catch {
      return;
    }
  }, [isAuthenticated]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    if (pendingMessagesRef.current.has(conversationId)) return;
    
    pendingMessagesRef.current.add(conversationId);
    setIsLoadingMessages(true);
    
    try {
      const response = await serviceLocator.messaging.getMessages(conversationId, 1, 50);
      const normalizedMessages = (response.messages ?? []).map(adaptMessage);

      normalizedMessages.forEach((message) => {
        if (message.id) rememberMessageId(message.id);
      });

      if (!mountedRef.current) return;

      setMessagesByConversationId((prev) => ({
        ...prev,
        [conversationId]: sortMessagesByTime(normalizedMessages),
      }));
    } catch {
      if (mountedRef.current) {
        setMessagesByConversationId((prev) => ({
          ...prev,
          [conversationId]: [],
        }));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoadingMessages(false);
      }
      pendingMessagesRef.current.delete(conversationId);
    }
  }, [rememberMessageId]);

  const setActiveConversation = useCallback((conversationId) => {
    setActiveConversationId(conversationId);
  }, []);

  const markRead = useCallback(async (conversationId) => {
    if (!conversationId) return;
    if (pendingReadRef.current.has(conversationId)) return;
    
    pendingReadRef.current.add(conversationId);
    
    try {
      await serviceLocator.messaging.markConversationRead(conversationId);
      
      try {
        await emitConversationRead(conversationId);
      } catch {
      }

      setConversations((prev) =>
        prev.map((conversation) => {
          if (conversation.id !== conversationId) return conversation;
          return {
            ...conversation,
            unreadCount: 0,
          };
        }),
      );

      await loadUnreadCount();
    } catch {
    } finally {
      pendingReadRef.current.delete(conversationId);
    }
  }, [loadUnreadCount]);

  const blockUserInConversation = useCallback(async (userId, reason = "") => {
    const applyBlockedStateForUser = () => {
      setBlockedUserIds((prev) => new Set([...prev, userId]));
      setBlockedStateByConversation((prev) => {
        const next = { ...prev };
        Object.entries(knownConversationParticipantsRef.current).forEach(
          ([conversationId, participantId]) => {
            if (participantId === userId) {
              next[conversationId] = resolveBlockedStatePriority(
                "i_blocked_them",
                next[conversationId],
              );
            }
          },
        );
        return next;
      });
    };

    try {
      await blockUser(userId, reason);
      applyBlockedStateForUser();
      navigate("/messages");
    } catch (err) {
      const errorText = String(err?.response?.data?.error ?? err?.message ?? "").toLowerCase();
      const isAlreadyBlocked =
        Number(err?.response?.status) === 409 ||
        errorText.includes("already blocked") ||
        (errorText.includes("request failed") && errorText.includes("409"));

      if (isAlreadyBlocked) {
        applyBlockedStateForUser();
        navigate("/messages");
        return;
      }

      console.error("Failed to block user:", err);
      throw err;
    }
  }, [navigate]);

  const unblockUserInConversation = useCallback(async (userId) => {
    try {
      await import("@/services/api").then(({ unblockUser }) => unblockUser(userId));
      setBlockedUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setBlockedStateByConversation((prev) => {
        const next = { ...prev };
        Object.entries(knownConversationParticipantsRef.current).forEach(
          ([conversationId, participantId]) => {
            if (participantId === userId && next[conversationId] === "i_blocked_them") {
              next[conversationId] = "none";
            }
          },
        );
        return next;
      });
    } catch (err) {
      console.error("Failed to unblock user:", err);
      throw err;
    }
  }, []);

  const openConversation = useCallback(async (recipientId) => {
    const normalizedRecipientId = String(recipientId ?? "").trim();
    if (!normalizedRecipientId) return null;

    if (blockedUserIds.has(normalizedRecipientId)) {
      setSendingError("You blocked this user. Unblock to send messages.");
      return null;
    }

    try {
      const conversation = await serviceLocator.messaging.startOrGetConversation(
        normalizedRecipientId,
      );

      if (conversation.blockStatus && conversation.blockStatus !== "none") {
        setBlockedStateByConversation((prev) => ({
          ...prev,
          [conversation.id]: resolveBlockedStatePriority(
            conversation.blockStatus,
            prev[conversation.id],
          ),
        }));
      }

      upsertConversation(conversation);
      setActiveConversationId(conversation.id);
      await loadMessages(conversation.id);
      return conversation;
    } catch (error) {
      const errorMessage =
        String(error?.response?.data?.error ?? error?.message ?? "").toLowerCase();

      if (errorMessage.includes("block")) {
        setSendingError("You cannot start a conversation due to block rules.");
      } else {
        setSendingError("Could not start conversation.");
      }
      return null;
    }
  }, [blockedUserIds, loadMessages, upsertConversation]);

  const sendMessage = useCallback(async ({ conversationId, text, sharedEntity }) => {
    const normalizedConversationId = String(conversationId ?? "").trim();
    if (!normalizedConversationId) return null;

    const blockedState = resolveBlockedStatePriority(
      blockedStateByConversation[normalizedConversationId],
    );
    if (blockedState === "i_blocked_them") {
      setSendingError("You blocked this user. Unblock to send messages or tracks.");
      return null;
    }
    if (blockedState === "they_blocked_me") {
      setSendingError("This user blocked you. You cannot send messages or tracks.");
      return null;
    }

    const trimmedText = String(text ?? "").trim();
    if (!trimmedText && !sharedEntity?.id) return null;

    setSendingError("");

    const clientNonce = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    const optimisticMessage = createOptimisticMessage({
      conversationId: normalizedConversationId,
      senderId: currentUserId,
      text: trimmedText,
      sharedEntity,
      clientNonce,
    });

    setMessagesByConversationId((prev) => {
      const existing = prev[normalizedConversationId] ?? [];
      return {
        ...prev,
        [normalizedConversationId]: sortMessagesByTime([...existing, optimisticMessage]),
      };
    });

    setConversations((prev) =>
      prev
        .map((conversation) => {
          if (conversation.id !== normalizedConversationId) return conversation;
          return {
            ...toConversationPreview(optimisticMessage, conversation),
          };
        })
        .sort((left, right) => {
          const leftTime = new Date(left.lastMessageAt ?? 0).getTime();
          const rightTime = new Date(right.lastMessageAt ?? 0).getTime();
          return rightTime - leftTime;
        }),
    );

    const socketAck = await emitMessageNew({
      conversationId: normalizedConversationId,
      text: trimmedText,
      sharedEntity,
    });

    if (socketAck?.success && socketAck?.data?.message) {
      reconcileOptimisticMessage(
        normalizedConversationId,
        clientNonce,
        socketAck.data.message,
      );
      return adaptMessage(socketAck.data.message);
    }

    try {
      const restResponse = await serviceLocator.messaging.sendMessageRest(
        normalizedConversationId,
        {
          text: trimmedText,
          sharedEntity,
        },
      );

      reconcileOptimisticMessage(
        normalizedConversationId,
        clientNonce,
        restResponse.message,
      );

      return restResponse.message;
    } catch (error) {
      markOptimisticMessageFailed(normalizedConversationId, clientNonce);

      const errorText = String(error?.response?.data?.error ?? error?.message ?? "").toLowerCase();
      if (errorText.includes("block")) {
        setBlockedStateByConversation((prev) => ({
          ...prev,
          [normalizedConversationId]: resolveBlockedStatePriority(
            "they_blocked_me",
            prev[normalizedConversationId],
          ),
        }));
        const nextState = resolveBlockedStatePriority(
          "they_blocked_me",
          blockedStateByConversation[normalizedConversationId],
        );
        setSendingError(
          nextState === "i_blocked_them"
            ? "You blocked this user. Unblock to send messages or tracks."
            : "This user blocked you. You cannot send messages or tracks.",
        );
      } else {
        setSendingError("Message failed to send.");
      }

      return null;
    }
  }, [
    blockedStateByConversation,
    currentUserId,
    markOptimisticMessageFailed,
    reconcileOptimisticMessage,
  ]);

  const shareTrackToConversation = useCallback(async ({ conversationId, trackId, text }) => {
    return sendMessage({
      conversationId,
      text,
      sharedEntity: { type: "track", id: trackId },
    });
  }, [sendMessage]);

  const sharePlaylistToConversation = useCallback(
    async ({ conversationId, playlistId, text }) => {
      return sendMessage({
        conversationId,
        text,
        sharedEntity: { type: "playlist", id: playlistId },
      });
    },
    [sendMessage],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setConnectionStatus("idle");
      disconnectMessagingSocket();
      cleanupListenersRef.current.forEach((cleanup) => cleanup());
      cleanupListenersRef.current = [];
      return;
    }

    const token = readAuthToken();
    if (!token) {
      setConnectionStatus("idle");
      return;
    }

    const socket = connectMessagingSocket({ token });
    setConnectionStatus(socket.connected ? "connected" : "connecting");

    const onConnect = () => setConnectionStatus("connected");
    const onDisconnect = () => setConnectionStatus("disconnected");

    const onIncomingMessage = (payload = {}) => {
      const message = payload.message ?? payload;
      appendMessage(message);
    };

    const onConversationRead = (payload = {}) => {
      const conversationId = payload.conversation_id ?? payload.conversationId;
      if (!conversationId) return;

      if (payload.reader_id && payload.reader_id === currentUserId) {
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  unreadCount: 0,
                }
              : conversation,
          ),
        );
      }

      loadUnreadCount();
    };

    cleanupListenersRef.current.forEach((cleanup) => cleanup());
    cleanupListenersRef.current = [
      subscribeSocketEvent("connect", onConnect),
      subscribeSocketEvent("disconnect", onDisconnect),
      subscribeSocketEvent("message:new", onIncomingMessage),
      subscribeSocketEvent("conversation:read", onConversationRead),
    ];

    return () => {
      cleanupListenersRef.current.forEach((cleanup) => cleanup());
      cleanupListenersRef.current = [];
    };
  }, [appendMessage, currentUserId, isAuthenticated, loadUnreadCount]);

  useEffect(() => {
    if (!activeConversationId) return;
    if (pendingReadRef.current.has(activeConversationId)) return;

    joinConversationRoom(activeConversationId);
    pendingReadRef.current.add(activeConversationId);
    markRead(activeConversationId);
    pendingReadRef.current.delete(activeConversationId);

    const currentConversation = conversations.find(
      (conversation) => conversation.id === activeConversationId,
    );

    if (!currentConversation) return;

    evaluateBlockedState(currentConversation).then((state) => {
      if (!mountedRef.current) return;
      setBlockedStateByConversation((prev) => {
        const previousState = prev[activeConversationId];
        const shouldPreservePrevious = state === "none" && isBlockedState(previousState);
        const resolvedState = shouldPreservePrevious
          ? previousState
          : resolveBlockedStatePriority(state, previousState);
        return {
          ...prev,
          [activeConversationId]: resolvedState,
        };
      });
    });
  }, [
    activeConversationId,
    conversations,
    evaluateBlockedState,
    markRead,
  ]);

  useEffect(() => {
    if (!isAuthenticated || initialLoadDoneRef.current) return;
    
    initialLoadDoneRef.current = true;
    loadBlockedUsers();
    loadConversations();
    loadUnreadCount();
  }, [isAuthenticated, loadBlockedUsers, loadConversations, loadUnreadCount]);

  const value = useMemo(
() => ({
      conversations,
      messagesByConversationId,
      activeConversationId,
      unreadTotal,
      connectionStatus,
      blockedStateByConversation,
      isLoadingConversations,
      isLoadingMessages,
      sendingError,
      loadConversations,
      loadUnreadCount,
      loadMessages,
openConversation,
      setActiveConversation,
      sendMessage,
      markRead,
      blockUser: blockUserInConversation,
      unblockUser: unblockUserInConversation,
      blockedUserIds,
      shareTrackToConversation,
      sharePlaylistToConversation,
    }),
    [
      conversations,
      messagesByConversationId,
      activeConversationId,
      unreadTotal,
      connectionStatus,
      blockedStateByConversation,
      isLoadingConversations,
      isLoadingMessages,
      sendingError,
      loadConversations,
      loadUnreadCount,
      loadMessages,
      openConversation,
      setActiveConversation,
      sendMessage,
      markRead,
      blockUserInConversation,
      unblockUserInConversation,
      blockedUserIds,
      shareTrackToConversation,
      sharePlaylistToConversation,
    ],
  );

  return (
    <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>
  );
};
