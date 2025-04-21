import React, { useState, useEffect, useRef } from 'react';
import './DocumentGenerator.css';
import {
  DOCUMENT_TYPES,
  suggestDocumentFormat,
  isLikelyTable,
  generatePDF,
  generateExcel,
  generateWord,
  saveDocument,
  parseContentToTableData
} from '../services/documentService';

const DocumentGenerator = ({ content, isVisible, onClose }) => {
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES.PDF);
  const [title, setTitle] = useState('Generated Document');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const downloadButtonRef = useRef(null);
  const modalRef = useRef(null);

  // Update document type and title when content changes
  useEffect(() => {
    if (content) {
      // Suggest the best document format based on content
      const suggestedFormat = suggestDocumentFormat(content);
      setDocumentType(suggestedFormat);

      // Try to extract a title from the content
      let extractedTitle = '';

      // Check for immersive content format with title
      const immersiveMatch = content.match(/<\/immersive>\s*id="[^"]*"\s*type="[^"]*"\s*title="([^"]*)"[^>]*>/i);
      if (immersiveMatch && immersiveMatch[1]) {
        extractedTitle = immersiveMatch[1];
      } else {
        // Try to extract a title from the first line of content
        const firstLine = content.split('\n')[0].trim();
        if (firstLine && firstLine.length < 100 && !firstLine.startsWith('```')) {
          extractedTitle = firstLine;
        }
      }

      // Set the title based on extracted content or document type
      if (extractedTitle) {
        setTitle(extractedTitle);
      } else if (suggestedFormat === DOCUMENT_TYPES.EXCEL) {
        setTitle('Generated Spreadsheet');
      } else if (suggestedFormat === DOCUMENT_TYPES.WORD) {
        setTitle('Generated Document');
      } else {
        setTitle('Generated PDF');
      }
    }
  }, [content]);

  // Focus on download button when it appears
  useEffect(() => {
    if (generatedDocument && downloadButtonRef.current) {
      downloadButtonRef.current.focus();
    }
  }, [generatedDocument]);

  // Auto-generate document when modal opens
  useEffect(() => {
    if (isVisible && content && !generatedDocument && !isGenerating) {
      // Wait a moment for the modal to fully appear
      const timer = setTimeout(() => {
        handleGenerateDocument();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, content, generatedDocument, isGenerating]);

  // Handle manual download
  const handleManualDownload = () => {
    if (generatedDocument) {
      try {
        // First try using the saveAs method from file-saver
        try {
          const { saveAs } = require('file-saver');
          saveAs(generatedDocument.blob, generatedDocument.filename);
        } catch (saveAsError) {
          // Fallback to our custom saveDocument function
          saveDocument(generatedDocument.blob, generatedDocument.filename);
        }

        // Show success message
        setSuccess(`Document "${generatedDocument.filename}" download initiated. If it doesn't appear, please check your browser's download settings.`);

        // Create a direct download link as a last resort
        const url = URL.createObjectURL(generatedDocument.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generatedDocument.filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      } catch (error) {
        console.error('Error during manual download:', error);
        setError(`Failed to download: ${error.message}. Please try again.`);
      }
    }
  };

  // Handle document generation
  const handleGenerateDocument = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSuccess(null);

      // Prepare options based on document type
      const options = {};

      if (documentType === DOCUMENT_TYPES.PDF) {
        // Determine if content is HTML
        options.isHtml = content.includes('<html>') ||
                         content.includes('<div>') ||
                         content.includes('<p>') ||
                         content.includes('<h1>');

        // Check if content is likely Markdown
        options.isMarkdown = content.includes('#') ||
                            content.includes('**') ||
                            content.includes('__') ||
                            content.includes('```') ||
                            content.includes('- ') ||
                            content.includes('1. ') ||
                            content.includes('[') && content.includes('](');
      }
      else if (documentType === DOCUMENT_TYPES.EXCEL) {
        // Check if content is likely a table
        if (isLikelyTable(content)) {
          // Let the service parse the content
          options.data = null;
        } else {
          // Create a simple table structure if not detected as a table
          const lines = content.split('\n').filter(line => line.trim());
          options.data = lines.map(line => [line]);
        }
      }
      else if (documentType === DOCUMENT_TYPES.WORD) {
        // Check if content has structure (paragraphs, etc.)
        options.isStructured = content.includes('\n\n');
      }

      // Generate the document
      setSuccess('Preparing document for download...');

      // First generate the blob without saving it
      let blob;
      let filename;

      // Sanitize title for filename
      const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

      switch (documentType) {
        case DOCUMENT_TYPES.PDF:
          blob = await generatePDF(
            content,
            title,
            options.isHtml || false,
            options.isMarkdown !== false
          );
          filename = `${sanitizedTitle}.pdf`;
          break;

        case DOCUMENT_TYPES.EXCEL:
          const tableData = options.data || parseContentToTableData(content);
          blob = generateExcel(tableData, title);
          filename = `${sanitizedTitle}.xlsx`;
          break;

        case DOCUMENT_TYPES.WORD:
          blob = await generateWord(
            content,
            title,
            options.isStructured || false,
            options.tableData || null
          );
          filename = `${sanitizedTitle}.docx`;
          break;

        default:
          throw new Error(`Unsupported document type: ${documentType}`);
      }

      // Store the generated document for manual download
      setGeneratedDocument({ blob, filename });

      // Try to trigger automatic download
      try {
        // First try using the saveAs method from file-saver
        try {
          const { saveAs } = require('file-saver');
          saveAs(blob, filename);
        } catch (saveAsError) {
          // Fallback to our custom saveDocument function
          saveDocument(blob, filename);
        }

        // Show success message with file details
        setSuccess(`Document "${filename}" (${Math.round(blob.size / 1024)} KB) has been generated and should download automatically.`);
      } catch (downloadError) {
        console.error('Error during automatic download:', downloadError);
        setSuccess(`Document "${filename}" (${Math.round(blob.size / 1024)} KB) has been generated. Please use the download button below.`);

        // Try a direct download link as a last resort
        try {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        } catch (directDownloadError) {
          console.error('Direct download also failed:', directDownloadError);
        }
      }
    } catch (error) {
      console.error('Error generating document:', error);
      setError(`Failed to generate document: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="document-generator-overlay">
      <div className="document-generator-modal" ref={modalRef}>
        <div className="document-generator-header">
          <h3>Generate Document</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="document-generator-body">
          <div className="form-group">
            <label htmlFor="document-title">Document Title</label>
            <input
              id="document-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="document-type">Document Type</label>
            <div className="document-type-selector">
              <button
                className={`document-type-button ${documentType === DOCUMENT_TYPES.PDF ? 'active' : ''}`}
                onClick={() => setDocumentType(DOCUMENT_TYPES.PDF)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H8V4H20V16ZM4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6ZM16 12V9C16 8.45 15.55 8 15 8H13V13H15C15.55 13 16 12.55 16 12ZM14 9H15V12H14V9ZM18 11H19V13H18V11ZM11 11H12V13H11V11ZM9 9H10C10.55 9 11 9.45 11 10V13H10V12H9V13H8V9H9ZM9 11H10V10H9V11Z" fill="currentColor"/>
                </svg>
                PDF
              </button>
              <button
                className={`document-type-button ${documentType === DOCUMENT_TYPES.EXCEL ? 'active' : ''}`}
                onClick={() => setDocumentType(DOCUMENT_TYPES.EXCEL)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 5V8H5V5H19ZM5 19V10H19V19H5ZM11 12H17V14H11V12ZM11 16H17V18H11V16ZM7 12H9V14H7V12ZM7 16H9V18H7V16Z" fill="currentColor"/>
                </svg>
                Excel
              </button>
              <button
                className={`document-type-button ${documentType === DOCUMENT_TYPES.WORD ? 'active' : ''}`}
                onClick={() => setDocumentType(DOCUMENT_TYPES.WORD)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM9.5 11C9.22 11 9 11.22 9 11.5V13H15V11.5C15 11.22 14.78 11 14.5 11H9.5ZM9 16H15V14.5C15 14.22 14.78 14 14.5 14H9.5C9.22 14 9 14.22 9 14.5V16Z" fill="currentColor"/>
                </svg>
                Word
              </button>
            </div>
          </div>

          <div className="document-preview">
            <h4>Content Preview</h4>
            <div className="preview-content">
              {content.length > 500
                ? content.substring(0, 500) + '...'
                : content}
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <p>{success}</p>
              {generatedDocument && (
                <button
                  className="manual-download-button"
                  onClick={handleManualDownload}
                  ref={downloadButtonRef}
                >
                  Download {generatedDocument.filename}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="document-generator-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="generate-button"
            onClick={handleGenerateDocument}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Document'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentGenerator;
