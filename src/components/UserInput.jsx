import { useState, useRef, useEffect } from 'react';

const UserInput = ({ onSendMessage, isLoading }) => {
  const [message, setMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message, uploadedFile);
      setMessage('');
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      // Add file name to message if it's empty
      if (!message.trim()) {
        setMessage(`Analyze this ${file.type.includes('image') ? 'image' : 'document'}: ${file.name}`);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="input-container">
      <div className="input-box">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Gemini..."
          className="input-field"
          rows={1}
          disabled={isLoading}
        />

        {/* File Upload Button */}
        <label className="file-upload-button">
          <input
            type="file"
            onChange={handleFileChange}
            ref={fileInputRef}
            accept="image/*,.pdf,.doc,.docx,.txt"
            disabled={isLoading}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </label>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? (
            <div className="loading"></div>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              width="20"
              height="20"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          )}
        </button>
      </div>

      {uploadedFile && (
        <div className="file-preview">
          <span className="file-name">{uploadedFile.name}</span>
          <button
            type="button"
            className="remove-file"
            onClick={() => {
              setUploadedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          >
            ×
          </button>
        </div>
      )}
    </form>
  );
};

export default UserInput;
