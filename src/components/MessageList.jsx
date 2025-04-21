import React from 'react';
import MessageGroup from './MessageGroup';

const MessageList = ({ messages }) => {
  return (
    <div className="messages">
      {messages.map((message) => (
        <MessageGroup key={message.id} message={message} />
      ))}
    </div>
  );
};

export default MessageList;
