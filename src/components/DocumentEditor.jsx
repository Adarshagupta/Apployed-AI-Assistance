import React, { useState, useEffect, useRef } from 'react';
import { generateContent } from '../services/geminiService';

const DocumentEditor = ({ onClose }) => {
  const [title, setTitle] = useState('Untitled Document');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const editorRef = useRef(null);

  // Function to check if we're on mobile
  const isMobile = () => window.innerWidth <= 768;

  // Load saved documents from localStorage and check screen size
  useEffect(() => {
    const savedDocuments = localStorage.getItem('apployd_documents');
    if (savedDocuments) {
      setDocuments(JSON.parse(savedDocuments));
    }

    // Set initial sidebar visibility based on screen size
    setIsSidebarVisible(!isMobile());

    // Add resize listener
    const handleResize = () => {
      if (!isMobile()) {
        setIsSidebarVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save documents to localStorage when they change
  useEffect(() => {
    localStorage.setItem('apployd_documents', JSON.stringify(documents));
  }, [documents]);

  // Create a new document
  const createNewDocument = () => {
    setTitle('Untitled Document');
    setContent('');
    setSelectedDocument(null);
    setIsEditing(true);
    setShowSuggestion(false);
    setAiSuggestion('');
  };

  // Save the current document
  const saveDocument = () => {
    setIsSaving(true);

    const newDoc = {
      id: selectedDocument ? selectedDocument.id : Date.now(),
      title,
      content,
      lastModified: new Date().toISOString()
    };

    if (selectedDocument) {
      // Update existing document
      setDocuments(documents.map(doc =>
        doc.id === selectedDocument.id ? newDoc : doc
      ));
    } else {
      // Create new document
      setDocuments([...documents, newDoc]);
    }

    setSelectedDocument(newDoc);
    setIsEditing(false);
    setIsSaving(false);
  };

  // Delete the current document
  const deleteDocument = (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setDocuments(documents.filter(doc => doc.id !== id));
      if (selectedDocument && selectedDocument.id === id) {
        setSelectedDocument(null);
        setTitle('Untitled Document');
        setContent('');
      }
    }
  };

  // Load a document for editing
  const loadDocument = (doc) => {
    setSelectedDocument(doc);
    setTitle(doc.title);
    setContent(doc.content);
    setIsEditing(false);
    setShowSuggestion(false);
    setAiSuggestion('');
  };

  // Generate AI suggestion for the document
  const generateSuggestion = async () => {
    if (!prompt.trim()) return;

    setIsGeneratingSuggestion(true);

    try {
      const currentContent = content || '';
      const promptText = `Document Title: ${title}\n\nCurrent Content:\n${currentContent}\n\nUser Request: ${prompt}\n\nPlease provide content based on the user's request that fits with the current document.`;

      const response = await generateContent(promptText);
      setAiSuggestion(response);
      setShowSuggestion(true);
    } catch (error) {
      console.error('Error generating suggestion:', error);
      setAiSuggestion('Sorry, I was unable to generate a suggestion. Please try again.');
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  // Apply the AI suggestion to the document
  const applySuggestion = () => {
    setContent(prev => {
      if (!prev.trim()) return aiSuggestion;
      return `${prev}\n\n${aiSuggestion}`;
    });
    setShowSuggestion(false);
    setAiSuggestion('');
    setPrompt('');
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="document-editor">
      <div className="document-editor-header">
        <div className="header-left">
          <button
            className="toggle-sidebar-button"
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            title={isSidebarVisible ? "Hide sidebar" : "Show sidebar"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h2>Collaborative Document Editor</h2>
        </div>
        <button className="close-button" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="document-editor-content">
        <div className={`document-sidebar ${isSidebarVisible ? 'visible' : 'hidden'}`}>
          <button className="new-document-button" onClick={createNewDocument}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Document
          </button>

          <div className="document-list">
            <h3>Your Documents</h3>
            {documents.length === 0 ? (
              <p className="no-documents">No documents yet. Create one to get started!</p>
            ) : (
              <ul>
                {documents.map(doc => (
                  <li
                    key={doc.id}
                    className={selectedDocument && selectedDocument.id === doc.id ? 'active' : ''}
                    onClick={() => loadDocument(doc)}
                  >
                    <div className="document-item">
                      <div className="document-info">
                        <span className="document-title">{doc.title}</span>
                        <span className="document-date">{formatDate(doc.lastModified)}</span>
                      </div>
                      <button
                        className="delete-document-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc.id);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="document-main">
          <div className="document-toolbar">
            {isEditing ? (
              <>
                <input
                  type="text"
                  className="document-title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document Title"
                />
                <button
                  className="save-document-button"
                  onClick={saveDocument}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <>
                <h3 className="document-title-display">{title}</h3>
                <button
                  className="edit-document-button"
                  onClick={() => setIsEditing(true)}
                  disabled={!selectedDocument && !content}
                >
                  Edit
                </button>
              </>
            )}
          </div>

          <div className="document-editor-main">
            {isEditing ? (
              <textarea
                ref={editorRef}
                className="document-content-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing your document here..."
              />
            ) : (
              <div className="document-content-display">
                {content ? (
                  <div className="markdown-content">
                    {content.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="no-content">
                    {selectedDocument
                      ? 'This document is empty. Click Edit to add content.'
                      : 'Select a document from the sidebar or create a new one.'}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="ai-assistant-panel">
            <h3>Apployd Assistant</h3>
            <div className="ai-prompt-container">
              <input
                type="text"
                className="ai-prompt-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Apployd to help with your document..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    generateSuggestion();
                  }
                }}
              />
              <button
                className="generate-button"
                onClick={generateSuggestion}
                disabled={isGeneratingSuggestion || !prompt.trim()}
              >
                {isGeneratingSuggestion ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>

            {showSuggestion && (
              <div className="ai-suggestion">
                <div className="suggestion-header">
                  <h4>Apployd's Suggestion</h4>
                  <div className="suggestion-actions">
                    <button
                      className="apply-suggestion-button"
                      onClick={applySuggestion}
                    >
                      Apply
                    </button>
                    <button
                      className="dismiss-suggestion-button"
                      onClick={() => {
                        setShowSuggestion(false);
                        setAiSuggestion('');
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
                <div className="suggestion-content">
                  {aiSuggestion.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;
