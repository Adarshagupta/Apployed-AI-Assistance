import React, { forwardRef } from 'react';
import MessageGroup from './MessageGroup';

const MessageList = forwardRef(({ messages }, ref) => {
  return (
    <div className="messages" ref={ref}>
      {messages.map((message) => (
        <MessageGroup key={message.id} message={message} />
      ))}
    </div>
  );
});

export default MessageList;
