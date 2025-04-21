import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const SharedDocument = () => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Parse the document data from the URL
    const parseSharedDocument = () => {
      try {
        setLoading(true);
        
        // Get the data parameter from the URL
        const params = new URLSearchParams(location.search);
        const encodedData = params.get('data');
        
        if (!encodedData) {
          throw new Error('No document data found in URL');
        }
        
        // Decode the data
        const decodedData = atob(encodedData);
        const documentData = JSON.parse(decodedData);
        
        // Validate the document data
        if (!documentData.id || !documentData.title || !documentData.content) {
          throw new Error('Invalid document data');
        }
        
        setDocument(documentData);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing shared document:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    parseSharedDocument();
  }, [location.search]);
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  // Handle saving the document to local storage
  const handleSaveDocument = () => {
    try {
      // Get existing documents from localStorage
      const existingDocumentsJson = localStorage.getItem('apployd_documents');
      const existingDocuments = existingDocumentsJson ? JSON.parse(existingDocumentsJson) : [];
      
      // Check if document with same ID already exists
      const existingIndex = existingDocuments.findIndex(doc => doc.id === document.id);
      
      if (existingIndex !== -1) {
        // Update existing document
        existingDocuments[existingIndex] = {
          ...document,
          lastModified: new Date().toISOString()
        };
      } else {
        // Add new document
        existingDocuments.push({
          ...document,
          lastModified: new Date().toISOString()
        });
      }
      
      // Save to localStorage
      localStorage.setItem('apployd_documents', JSON.stringify(existingDocuments));
      
      alert('Document saved to your documents!');
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document. Please try again.');
    }
  };
  
  // Handle going back to the main app
  const handleGoToApp = () => {
    navigate('/');
  };
  
  if (loading) {
    return (
      <div className="shared-document-container">
        <div className="shared-document-loading">
          <div className="loading-spinner"></div>
          <p>Loading shared document...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="shared-document-container">
        <div className="shared-document-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2>Error Loading Document</h2>
          <p>{error}</p>
          <button className="go-to-app-button" onClick={handleGoToApp}>
            Go to Apployd
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="shared-document-container">
      <div className="shared-document-header">
        <div className="shared-document-info">
          <h1>{document.title}</h1>
          <div className="shared-document-meta">
            <span>Shared by: {document.createdBy || 'Apployd User'}</span>
            <span>Last modified: {formatDate(document.lastModified)}</span>
            {document.shareDate && (
              <span>Shared on: {formatDate(document.shareDate)}</span>
            )}
          </div>
        </div>
        <div className="shared-document-actions">
          <button className="save-shared-button" onClick={handleSaveDocument}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Save to My Documents
          </button>
          <button className="go-to-app-button" onClick={handleGoToApp}>
            Go to Apployd
          </button>
        </div>
      </div>
      
      <div className="shared-document-content">
        {document.content.split('\n').map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </div>
  );
};

export default SharedDocument;
