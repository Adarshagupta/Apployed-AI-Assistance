import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ImmersiveDocument from './ImmersiveDocument';

const MessageGroup = ({ message }) => {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const isError = message.isError;

  // Function to render code blocks with syntax highlighting
  const renderCodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  };

  // Check if a message contains immersive content
  const hasImmersiveContent = (text) => {
    return text && text.includes('<immersive>') && text.includes('</immersive>');
  };

  // Render file attachment if present
  const renderFileAttachment = () => {
    if (!message.file) return null;

    const { name, type, size } = message.file;
    const isImage = type.includes('image');
    const fileSize = size < 1024 * 1024
      ? `${Math.round(size / 1024)} KB`
      : `${Math.round(size / (1024 * 1024) * 10) / 10} MB`;

    return (
      <div className="file-attachment">
        <div className="file-attachment-icon">
          {isImage ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 16L8.58579 11.4142C9.36683 10.6332 10.6332 10.6332 11.4142 11.4142L16 16M14 14L15.5858 12.4142C16.3668 11.6332 17.6332 11.6332 18.4142 12.4142L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <div className="file-attachment-info">
          <div className="file-attachment-name">{name}</div>
          <div className="file-attachment-meta">{fileSize} • {type.split('/')[1]}</div>
        </div>
      </div>
    );
  };

  // Render image badge for image analysis responses
  const renderImageBadge = () => {
    if (!message.hasImage) return null;

    return (
      <div className="image-analysis-badge">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 16L8.58579 11.4142C9.36683 10.6332 10.6332 10.6332 11.4142 11.4142L16 16M14 14L15.5858 12.4142C16.3668 11.6332 17.6332 11.6332 18.4142 12.4142L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>Image Analysis: {message.imageName}</span>
      </div>
    );
  };

  // If it's a system message, render it differently
  if (isSystem) {
    // Check if it's a search-related message
    const isSearching = message.text.includes('Searching the web');
    const isSearchResults = message.text.includes('Found') && message.text.includes('results for');

    return (
      <div className="message-group system">
        <div className={`system-message ${isSearching ? 'searching' : ''} ${isSearchResults ? 'search-results' : ''}`}>
          {isSearching ? (
            <>
              <div className="search-spinner"></div>
              <span>{message.text}</span>
            </>
          ) : isSearchResults ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{message.text}</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{message.text}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Text-to-speech and feedback buttons have been removed

  return (
    <div className={`message-group ${isUser ? 'user' : 'ai'}`}>
      <div className="message-content">
        {isError ? (
          <div className="message-text" style={{ color: 'var(--gemini-error)' }}>
            {message.text}
          </div>
        ) : hasImmersiveContent(message.text) ? (
          <ImmersiveDocument content={message.text} />
        ) : (
          <>
            {message.hasImage && renderImageBadge()}
            <div className="message-text">
              <ReactMarkdown
                components={{
                  code: renderCodeBlock,
                }}
              >
                {message.text}
              </ReactMarkdown>
            </div>
            {message.file && renderFileAttachment()}
          </>
        )}
      </div>
    </div>
  );
};

export default MessageGroup;
