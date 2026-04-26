import axios from "axios";
import {
  adaptConversation,
  adaptMessage,
  isMessagePayloadValid,
  toBackendMessagePayload,
} from "@/messages/adapters/messagingAdapter";

const MESSAGING_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/v1";
const NORMALIZED_BASE = MESSAGING_BASE_URL.endsWith("/v1")
  ? MESSAGING_BASE_URL
  : `${MESSAGING_BASE_URL.replace(/\/$/, "")}/v1`;

const apiClient = axios.create({
  baseURL: NORMALIZED_BASE,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("pulsify_access_token") ??
    localStorage.getItem("pulsify_jwt_token") ??
    localStorage.getItem("pulsify_token") ??
    localStorage.getItem("accessToken") ??
    "";

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const unwrapData = (responseData) => {
  if (responseData?.data !== undefined) return responseData.data;
  return responseData;
};

export const getConversations = async (page = 1, limit = 20) => {
  const { data } = await apiClient.get(`/conversations?page=${page}&limit=${limit}`);
  const payload = unwrapData(data);
  const rawConversations = Array.isArray(payload?.conversations)
    ? payload.conversations
    : [];

  return {
    conversations: rawConversations.map(adaptConversation),
    total: Number(payload?.total ?? rawConversations.length),
    page: Number(payload?.page ?? page),
    limit: Number(payload?.limit ?? limit),
  };
};

export const startOrGetConversation = async (recipientIdentifier) => {
  const normalized = String(recipientIdentifier ?? "").trim();
  
  if (!normalized) {
    throw new Error("Recipient username or user ID is required.");
  }

  const { data } = await apiClient.post("/conversations", {
    recipient_id: normalized,
  });

  const payload = unwrapData(data);
  return adaptConversation(payload);
};

export const findUserByUsername = async (username) => {
  const normalized = String(username ?? "").trim();
  if (!normalized) {
    throw new Error("Username is required.");
  }

  const { data } = await apiClient.get(`/users/search?username=${encodeURIComponent(normalized)}`);
  const payload = unwrapData(data);
  
  return {
    id: payload?.id ?? "",
    username: payload?.username ?? "",
    display_name: payload?.display_name ?? payload?.displayName ?? "",
    avatar_url: payload?.avatar_url ?? payload?.avatarUrl ?? "",
  };
};

export const getUnreadCount = async () => {
  const { data } = await apiClient.get("/conversations/unread-count");
  const payload = unwrapData(data);
  return Number(payload?.unread_count ?? 0);
};

export const getMessages = async (conversationId, page = 1, limit = 50) => {
  const { data } = await apiClient.get(
    `/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
  );
  const payload = unwrapData(data);
  const rawMessages = Array.isArray(payload?.messages) ? payload.messages : [];

  return {
    messages: rawMessages.map(adaptMessage),
    total: Number(payload?.total ?? rawMessages.length),
    page: Number(payload?.page ?? page),
    limit: Number(payload?.limit ?? limit),
  };
};

export const sendMessageRest = async (conversationId, messageInput) => {
  const payload = toBackendMessagePayload(messageInput);
  if (!isMessagePayloadValid(payload)) {
    throw new Error("Message must include text or shared entity.");
  }

  const { data } = await apiClient.post(
    `/conversations/${conversationId}/messages`,
    payload,
  );

  const unwrapped = unwrapData(data);
  return {
    message: adaptMessage(unwrapped?.message ?? unwrapped),
    conversationId: unwrapped?.conversationId ?? conversationId,
    recipientId: unwrapped?.recipientId ?? null,
    lastMessageAt: unwrapped?.lastMessageAt ?? null,
  };
};

export const markConversationRead = async (conversationId) => {
  const { data } = await apiClient.put(`/conversations/${conversationId}/read`);
  const payload = unwrapData(data);

  return {
    conversationId: payload?.conversationId ?? conversationId,
    markedCount: Number(payload?.markedCount ?? payload?.marked_count ?? 0),
    readAt: payload?.readAt ?? payload?.read_at ?? new Date().toISOString(),
  };
};
