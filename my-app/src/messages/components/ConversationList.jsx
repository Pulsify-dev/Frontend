import { ConversationListItem } from "@/messages/components/ConversationListItem";

export const ConversationList = ({
  conversations,
  activeConversationId,
  onOpenConversation,
  isLoading,
  onOpenNewMessage,
}) => {
  return (
    <section className="messages-list-shell">
      <header className="messages-list-header">
        <h1>Messages</h1>
        {onOpenNewMessage && (
          <button type="button" className="sc-btn" onClick={onOpenNewMessage}>
            New
          </button>
        )}
      </header>

      {isLoading ? (
        <div className="messages-list-state">
          <span className="messages-loading-spinner" />
          <span>Loading conversations...</span>
        </div>
      ) : !conversations.length ? (
        <div className="messages-list-state">
          <span>No conversations yet.</span>
        </div>
      ) : (
        <div className="messages-list-items">
          {conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
              onOpen={onOpenConversation}
            />
          ))}
        </div>
      )}
    </section>
  );
};