import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ImmersiveDocument from './ImmersiveDocument';
import { speak, stop, isSpeaking } from '../services/textToSpeechService';

const MessageGroup = ({ message }) => {
  const [isSpeakingThis, setIsSpeakingThis] = useState(false);
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

  // Handle text-to-speech
  const handleTextToSpeech = () => {
    if (isSpeakingThis) {
      stop();
      setIsSpeakingThis(false);
    } else {
      // Stop any currently playing speech
      if (isSpeaking()) {
        stop();
      }

      // Extract plain text from message
      let textToSpeak = message.text;

      // Remove markdown and code blocks for better speech
      textToSpeak = textToSpeak.replace(/```[\s\S]*?```/g, 'Code block omitted for speech.');
      textToSpeak = textToSpeak.replace(/`([^`]+)`/g, '$1');
      textToSpeak = textToSpeak.replace(/\*\*([^*]+)\*\*/g, '$1');
      textToSpeak = textToSpeak.replace(/\*([^*]+)\*/g, '$1');
      textToSpeak = textToSpeak.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

      speak(textToSpeak, {
        onEnd: () => setIsSpeakingThis(false),
        onError: () => setIsSpeakingThis(false)
      });

      setIsSpeakingThis(true);
    }
  };

  // Render feedback buttons for AI messages
  const renderFeedbackButtons = () => {
    if (isUser) return null;

    return (
      <div className="message-feedback">
        <button
          className={`feedback-button ${isSpeakingThis ? 'active' : ''}`}
          title={isSpeakingThis ? 'Stop speaking' : 'Listen'}
          onClick={handleTextToSpeech}
        >
          {isSpeakingThis ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4H6V20H10V4Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 4H14V20H18V4Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <button className="feedback-button" title="Like">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V13C2 12.4696 2.21071 11.9609 2.58579 11.5858C2.96086 11.2107 3.46957 11 4 11H7M14 9V5C14 4.20435 13.6839 3.44129 13.1213 2.87868C12.5587 2.31607 11.7956 2 11 2L7 11V22H18.28C18.7623 22.0055 19.2304 21.8364 19.5979 21.524C19.9654 21.2116 20.2077 20.7769 20.28 20.3L21.66 11.3C21.7035 11.0134 21.6842 10.7207 21.6033 10.4423C21.5225 10.1638 21.3821 9.90629 21.1919 9.68751C21.0016 9.46873 20.7661 9.29393 20.5016 9.17522C20.2371 9.0565 19.9499 8.99672 19.66 9H14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="feedback-button" title="Dislike">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 2H20C20.5304 2 21.0391 2.21071 21.4142 2.58579C21.7893 2.96086 22 3.46957 22 4V11C22 11.5304 21.7893 12.0391 21.4142 12.4142C21.0391 12.7893 20.5304 13 20 13H17M10 15V19C10 19.7956 10.3161 20.5587 10.8787 21.1213C11.4413 21.6839 12.2044 22 13 22L17 13V2H5.72C5.23768 1.99448 4.76965 2.16359 4.40209 2.47599C4.03452 2.78839 3.79217 3.22309 3.72 3.7L2.34 12.7C2.29651 12.9866 2.31583 13.2793 2.39666 13.5577C2.4775 13.8362 2.61791 14.0937 2.80815 14.3125C2.99839 14.5313 3.23393 14.7061 3.49843 14.8248C3.76294 14.9435 4.05009 15.0033 4.34 15H10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="feedback-button" title="Regenerate">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 4V10H7M23 20V14H17M20.49 9C19.9828 7.56678 19.1209 6.2854 17.9845 5.27542C16.8482 4.26543 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.56471 5.64 5.64L1 10M23 14L18.36 18.36C17.2853 19.4353 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1112 10.0083 20.7757C8.52547 20.4402 7.1518 19.7346 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="feedback-button more-options" title="More options">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  };

  // Render star icon for AI messages
  const renderStarIcon = () => {
    if (isUser) return null;

    return (
      <div className="ai-star-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#4285f4" stroke="#4285f4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  };

  return (
    <div className={`message-group ${isUser ? 'user' : 'ai'}`}>
      {!isUser && renderStarIcon()}
      <div className={`message-avatar ${isUser ? 'user' : 'ai'}`}>
        {isUser ? 'Y' : 'A'}
      </div>
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
        {renderFeedbackButtons()}
      </div>
    </div>
  );
};

export default MessageGroup;
