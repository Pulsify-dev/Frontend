const mapSharedEntityType = (value) => {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "track") return "track";
  if (normalized === "playlist") return "playlist";
  if (normalized === "album") return "album";
  return "track";
};

const toNormalizedId = (value) => String(value ?? "").trim();

const readOptionalText = (value) => {
  const normalized = String(value ?? "").trim();
  return normalized || "";
};

const mapUser = (user = {}) => ({
  id: toNormalizedId(user._id ?? user.id),
  username: user.username ?? "",
  displayName: user.display_name ?? user.displayName ?? user.username ?? "Unknown user",
  avatarUrl: user.avatar_url ?? user.avatarUrl ?? "",
  isVerified: Boolean(user.is_verified ?? user.isVerified),
});

const mapSharedEntity = (shared) => {
  if (!shared) return null;

  const title = readOptionalText(
    shared.title ??
      shared.name ??
      shared.track_title ??
      shared.trackTitle ??
      shared.playlist_title ??
      shared.playlistTitle,
  );

  const subtitle = readOptionalText(
    shared.artist_name ??
      shared.artistName ??
      shared.artist ??
      shared.owner_username ??
      shared.ownerUsername ??
      shared.subtitle,
  );

  const imageUrl = readOptionalText(
    shared.cover_art ??
      shared.coverArt ??
      shared.artwork_url ??
      shared.artworkUrl ??
      shared.thumbnail_url ??
      shared.thumbnailUrl ??
      shared.image_url ??
      shared.imageUrl,
  );

  return {
    type: mapSharedEntityType(shared.type),
    id: toNormalizedId(shared.id),
    ...(title ? { title } : {}),
    ...(subtitle ? { subtitle } : {}),
    ...(imageUrl ? { imageUrl } : {}),
  };
};

const mapBlockedState = (blockStatus = {}) => {
  if (blockStatus.blocked_by_me) {
    return "i_blocked_them";
  }
  if (blockStatus.blocked_by_them) {
    return "they_blocked_me";
  }
  return "none";
};

export const adaptConversation = (dto = {}) => {
  const other = dto.other_participant ?? dto.otherParticipant ?? {};
  const lastMessageAt = dto.last_message_at ?? dto.lastMessageAt ?? dto.updatedAt ?? null;
  const lastMessageText =
    dto.last_message_text ??
    dto.lastMessageText ??
    dto.last_message?.text ??
    dto.lastMessage?.text ??
    "";

  return {
    id: toNormalizedId(dto._id ?? dto.id),
    participants: Array.isArray(dto.participants)
      ? dto.participants.map((participantId) => toNormalizedId(participantId)).filter(Boolean)
      : [],
    participantPairId: toNormalizedId(dto.participant_pair_id ?? dto.participantPairId),
    lastMessageAt,
    lastMessageText,
    createdAt: dto.createdAt ?? null,
    updatedAt: dto.updatedAt ?? lastMessageAt,
    otherParticipant: mapUser(other),
    unreadCount: Number(dto.unread_count ?? dto.unreadCount ?? 0),
    blockStatus: mapBlockedState(dto.block_status ?? dto.blockStatus ?? {}),
  };
};

export const adaptMessage = (dto = {}) => {
  const shared = dto.shared_entity ?? dto.sharedEntity;

  return {
    id: toNormalizedId(dto._id ?? dto.id),
    conversationId: toNormalizedId(dto.conversation_id ?? dto.conversationId),
    senderId: toNormalizedId(dto.sender_id ?? dto.senderId),
    text: dto.text ?? "",
    sharedEntity: mapSharedEntity(shared),
    isRead: Boolean(dto.is_read ?? dto.isRead),
    readAt: dto.read_at ?? dto.readAt ?? null,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    updatedAt: dto.updatedAt ?? dto.createdAt ?? new Date().toISOString(),
    deliveryState: "sent",
    clientNonce: null,
  };
};

export const toBackendMessagePayload = ({ text, sharedEntity }) => {
  const payload = {};

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

  return payload;
};

export const isMessagePayloadValid = (payload = {}) => {
  const hasText = Boolean(String(payload.text ?? "").trim());
  const hasSharedEntity = Boolean(payload.shared_entity?.id && payload.shared_entity?.type);
  return hasText || hasSharedEntity;
};

export const sortMessagesByTime = (messages = []) => {
  return [...messages].sort((left, right) => {
    const leftTime = new Date(left.createdAt ?? 0).getTime();
    const rightTime = new Date(right.createdAt ?? 0).getTime();
    return leftTime - rightTime;
  });
};

export const createOptimisticMessage = ({
  conversationId,
  senderId,
  text,
  sharedEntity,
  clientNonce,
}) => {
  const title = readOptionalText(sharedEntity?.title);
  const subtitle = readOptionalText(sharedEntity?.subtitle ?? sharedEntity?.artist);
  const imageUrl = readOptionalText(
    sharedEntity?.imageUrl ?? sharedEntity?.coverArt ?? sharedEntity?.cover_art,
  );

  return {
    id: `optimistic-${clientNonce}`,
    conversationId: toNormalizedId(conversationId),
    senderId: toNormalizedId(senderId),
    text: String(text ?? "").trim(),
    sharedEntity: sharedEntity
      ? {
          type: mapSharedEntityType(sharedEntity.type),
          id: toNormalizedId(sharedEntity.id),
          ...(title ? { title } : {}),
          ...(subtitle ? { subtitle } : {}),
          ...(imageUrl ? { imageUrl } : {}),
        }
      : null,
    isRead: true,
    readAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deliveryState: "sending",
    clientNonce,
  };
};
