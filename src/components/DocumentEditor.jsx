import React, { useState, useEffect, useRef } from 'react';
import { generateContent } from '../services/geminiService';
import { exportToPDF, exportToDOCX, exportToHTML, exportToTXT } from '../services/documentExportService';
import { generateShareableLink, shareViaEmail, copyLinkToClipboard } from '../services/documentSharingService';

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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const [shareEmail, setShareEmail] = useState('');
  const [exportStatus, setExportStatus] = useState({ loading: false, success: false, error: null });
  const [shareStatus, setShareStatus] = useState({ loading: false, success: false, error: null });
  const editorRef = useRef(null);
  const exportMenuRef = useRef(null);
  const shareMenuRef = useRef(null);

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

  // Handle click outside of menus to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Export document functions
  const handleExport = (format) => {
    if (!title || !content) {
      alert('Cannot export an empty document. Please add some content first.');
      return;
    }

    setExportStatus({ loading: true, success: false, error: null });

    try {
      switch (format) {
        case 'pdf':
          exportToPDF(title, content);
          break;
        case 'docx':
          exportToDOCX(title, content);
          break;
        case 'html':
          exportToHTML(title, content);
          break;
        case 'txt':
          exportToTXT(title, content);
          break;
        default:
          throw new Error('Unsupported format');
      }

      setExportStatus({ loading: false, success: true, error: null });
      setShowExportMenu(false);

      // Reset success status after 3 seconds
      setTimeout(() => {
        setExportStatus(prev => ({ ...prev, success: false }));
      }, 3000);
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error);
      setExportStatus({ loading: false, success: false, error: error.message });
    }
  };

  // Share document functions
  const handleGenerateShareableLink = () => {
    if (!title || !content) {
      alert('Cannot share an empty document. Please add some content first.');
      return;
    }

    setShareStatus({ loading: true, success: false, error: null });

    try {
      // Create document object
      const documentToShare = {
        id: selectedDocument ? selectedDocument.id : Date.now(),
        title,
        content,
        lastModified: new Date().toISOString()
      };

      // Generate link
      const link = generateShareableLink(documentToShare);
      setShareableLink(link);

      setShareStatus({ loading: false, success: true, error: null });

      // Reset success status after 3 seconds
      setTimeout(() => {
        setShareStatus(prev => ({ ...prev, success: false }));
      }, 3000);
    } catch (error) {
      console.error('Error generating shareable link:', error);
      setShareStatus({ loading: false, success: false, error: error.message });
    }
  };

  const handleCopyLink = async () => {
    try {
      await copyLinkToClipboard(shareableLink);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying link:', error);
      alert('Failed to copy link to clipboard.');
    }
  };

  const handleShareViaEmail = () => {
    if (!shareEmail.trim()) {
      alert('Please enter an email address.');
      return;
    }

    try {
      shareViaEmail(shareEmail, shareableLink, title);
      setShareEmail('');
      alert('Email client opened with pre-filled message.');
    } catch (error) {
      console.error('Error sharing via email:', error);
      alert('Failed to share via email.');
    }
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
                <div className="toolbar-actions">
                  <button
                    className="save-document-button"
                    onClick={saveDocument}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="document-title-display">{title}</h3>
                <div className="toolbar-actions">
                  <div className="document-actions">
                    {/* Export Menu */}
                    <div className="dropdown-container">
                      <button
                        className="toolbar-button export-button"
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={!content}
                        title="Export document"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Export</span>
                      </button>

                      {showExportMenu && (
                        <div className="dropdown-menu" ref={exportMenuRef}>
                          <button onClick={() => handleExport('pdf')} className="dropdown-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M9 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M9 11H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            PDF
                          </button>
                          <button onClick={() => handleExport('docx')} className="dropdown-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Word
                          </button>
                          <button onClick={() => handleExport('html')} className="dropdown-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 13L8 17H6L9 9H11L14 17H12L10 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 17V13L20 17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M4 6V4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2H18C18.5304 2 19.0391 2.21071 19.4142 2.58579C19.7893 2.96086 20 3.46957 20 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M4 18V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            HTML
                          </button>
                          <button onClick={() => handleExport('txt')} className="dropdown-item">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Text
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Share Menu */}
                    <div className="dropdown-container">
                      <button
                        className="toolbar-button share-button"
                        onClick={() => {
                          setShowShareMenu(!showShareMenu);
                          if (!showShareMenu && !shareableLink) {
                            handleGenerateShareableLink();
                          }
                        }}
                        disabled={!content}
                        title="Share document"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8.59 13.51L15.42 17.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M15.41 6.51L8.59 10.49" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>Share</span>
                      </button>

                      {showShareMenu && (
                        <div className="dropdown-menu share-menu" ref={shareMenuRef}>
                          <div className="share-menu-header">Share Document</div>

                          {shareableLink && (
                            <div className="share-link-container">
                              <input
                                type="text"
                                value={shareableLink}
                                readOnly
                                className="share-link-input"
                              />
                              <button
                                className="copy-link-button"
                                onClick={handleCopyLink}
                                title="Copy link"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M20 9H11C9.89543 9 9 9.89543 9 11V20C9 21.1046 9.89543 22 11 22H20C21.1046 22 22 21.1046 22 20V11C22 9.89543 21.1046 9 20 9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Copy
                              </button>
                            </div>
                          )}

                          <div className="share-via-email">
                            <div className="share-menu-subheader">Share via Email</div>
                            <div className="email-input-container">
                              <input
                                type="email"
                                value={shareEmail}
                                onChange={(e) => setShareEmail(e.target.value)}
                                placeholder="Enter email address"
                                className="email-input"
                              />
                              <button
                                className="send-email-button"
                                onClick={handleShareViaEmail}
                                disabled={!shareEmail.trim() || !shareableLink}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Send
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    className="edit-document-button"
                    onClick={() => setIsEditing(true)}
                    disabled={!selectedDocument && !content}
                  >
                    Edit
                  </button>
                </div>
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
