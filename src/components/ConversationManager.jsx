import React, { useState, useEffect } from 'react';
import {
  getAllConversations,
  getCurrentConversation,
  switchConversation,
  createNewConversation,
  resetMemory
} from '../services/memoryService';

const ConversationManager = () => {
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Load conversations
  useEffect(() => {
    loadConversations();
    const currentConvo = getCurrentConversation();
    if (currentConvo) {
      setCurrentConversationId(currentConvo.id);
    }
  }, []);

  // Load conversations
  const loadConversations = () => {
    const allConversations = getAllConversations();
    setConversations(allConversations);
  };

  // Handle conversation switch
  const handleSwitchConversation = (id) => {
    if (switchConversation(id)) {
      setCurrentConversationId(id);
      // Reload the page to reset the chat interface
      window.location.reload();
    }
  };

  // Handle new conversation
  const handleNewConversation = () => {
    const newId = createNewConversation();
    setCurrentConversationId(newId);
    loadConversations();
    // Reload the page to reset the chat interface
    window.location.reload();
  };

  // Handle reset all memory
  const handleResetMemory = () => {
    if (window.confirm('Are you sure you want to reset all memory? This will delete all conversations and learned information.')) {
      resetMemory();
      loadConversations();
      const currentConvo = getCurrentConversation();
      if (currentConvo) {
        setCurrentConversationId(currentConvo.id);
      }
      // Reload the page to reset the chat interface
      window.location.reload();
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="conversation-manager">
      <div className="conversation-header">
        <h3>Conversations</h3>
        <div className="conversation-actions">
          <button
            className="new-conversation-btn"
            onClick={handleNewConversation}
            title="Start a new conversation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="btn-text">New Chat</span>
          </button>
          <button
            className="reset-memory-btn"
            onClick={handleResetMemory}
            title="Reset all memory"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="btn-text">Reset All</span>
          </button>
        </div>
      </div>

      <div className="conversations-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">
            No conversations yet. Start chatting to create one!
          </div>
        ) : (
          conversations.map(conversation => (
            <div
              key={conversation.id}
              className={`conversation-item ${conversation.id === currentConversationId ? 'active' : ''}`}
              onClick={() => handleSwitchConversation(conversation.id)}
            >
              <div className="conversation-title">{conversation.title}</div>
              <div className="conversation-meta">
                <span className="conversation-date">{formatDate(conversation.updatedAt)}</span>
                <span className="conversation-messages">{conversation.messages.length} messages</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationManager;
