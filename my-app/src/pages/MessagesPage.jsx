import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConversationList } from "@/messages/components/ConversationList";
import { MessageThread } from "@/messages/components/MessageThread";
import { useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/contexts/AuthContext";
import "@/messages/MessagesPage.css";

const MessagesPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    conversations,
    messagesByConversationId,
    activeConversationId,
    blockedStateByConversation,
    isLoadingConversations,
    isLoadingMessages,
    sendingError,
    openConversation,
    setActiveConversation,
    loadMessages,
    sendMessage,
    markRead,
  } = useMessaging();

  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [recipientUsernameDraft, setRecipientUsernameDraft] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [newMessageError, setNewMessageError] = useState("");
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const effectiveConversationId = conversationId || activeConversationId;

  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversation(conversationId);
    }
  }, [conversationId, activeConversationId, setActiveConversation]);

  useEffect(() => {
    if (!effectiveConversationId) return;
    loadMessages(effectiveConversationId);
    markRead(effectiveConversationId);
  }, [effectiveConversationId, loadMessages, markRead]);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === effectiveConversationId) ||
      null,
    [conversations, effectiveConversationId],
  );

  const activeMessages = useMemo(() => {
    if (!effectiveConversationId) return [];
    return messagesByConversationId[effectiveConversationId] ?? [];
  }, [effectiveConversationId, messagesByConversationId]);

  const handleOpenConversation = (nextConversationId) => {
    setActiveConversation(nextConversationId);
    navigate(`/messages/${nextConversationId}`);
  };

  const handleSendMessage = async ({ text, sharedEntity }) => {
    if (!effectiveConversationId) return false;

    const sent = await sendMessage({
      conversationId: effectiveConversationId,
      text,
      sharedEntity: sharedEntity || null,
    });

    return Boolean(sent);
  };

  const handleOpenNewMessageModal = () => {
    setNewMessageError("");
    setIsNewMessageOpen(true);
  };

  const handleCloseNewMessageModal = () => {
    if (isCreatingConversation) return;
    setIsNewMessageOpen(false);
  };

  const handleCreateConversation = async (event) => {
    event.preventDefault();

const normalizedUsername = String(recipientUsernameDraft ?? "").trim();
  if (!normalizedUsername) {
    setNewMessageError("Username is required.");
    return;
  }

    setIsCreatingConversation(true);
    setNewMessageError("");

    const conversation = await openConversation(normalizedUsername);

    if (!conversation?.id) {
      setNewMessageError("Could not create conversation. Check username.");
      setIsCreatingConversation(false);
      return;
    }

    const initialMessage = draftMessage.trim();
    if (initialMessage) {
      await sendMessage({
        conversationId: conversation.id,
        text: initialMessage,
        sharedEntity: null,
      });
    }

    setIsCreatingConversation(false);
    setIsNewMessageOpen(false);
    setRecipientUsernameDraft("");
    setDraftMessage("");
    setActiveConversation(conversation.id);
    navigate(`/messages/${conversation.id}`);
  };

  return (
    <div className="messages-page">
      <div className="messages-layout">
        <ConversationList
          conversations={conversations}
          activeConversationId={effectiveConversationId}
          onOpenConversation={handleOpenConversation}
          isLoading={isLoadingConversations}
          onOpenNewMessage={handleOpenNewMessageModal}
        />

        <MessageThread
          conversation={activeConversation}
          messages={activeMessages}
          currentUserId={user?.id}
          blockedState={
            effectiveConversationId
              ? blockedStateByConversation[effectiveConversationId] || activeConversation?.blockStatus || "none"
              : "none"
          }
          onSendMessage={handleSendMessage}
          sendingError={sendingError}
          isLoading={isLoadingMessages}
        />
      </div>

      {isNewMessageOpen ? (
        <div className="messages-modal-overlay" role="dialog" aria-modal="true" aria-label="New message">
          <div className="messages-modal">
            <button
              type="button"
              className="messages-modal-close"
              aria-label="Close new message dialog"
              onClick={handleCloseNewMessageModal}
            >
              ×
            </button>

            <h2>New message</h2>

            <form onSubmit={handleCreateConversation}>
              <label className="messages-modal-field-label">To <span>*</span></label>
<input
  className="messages-modal-input"
  type="text"
  placeholder="Enter username"
  value={recipientUsernameDraft}
  onChange={(event) => setRecipientUsernameDraft(event.target.value)}
  disabled={isCreatingConversation}
/>

              <label className="messages-modal-field-label">Write your message and add tracks or playlists <span>*</span></label>
              <textarea
                className="messages-modal-textarea"
                placeholder="Write a message"
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                rows={5}
                disabled={isCreatingConversation}
              />

              <div className="messages-modal-actions">
                <button type="button" className="messages-secondary-btn">
                  Add track or playlist
                </button>

                <button type="submit" className="messages-primary-btn" disabled={isCreatingConversation}>
                  {isCreatingConversation ? "Sending" : "Send"}
                </button>
              </div>

              {newMessageError || sendingError ? (
                <p className="messages-composer-note messages-composer-note-error">
                  {newMessageError || sendingError}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MessagesPage;