import React, { useState, useEffect } from 'react';

const FeatureToggles = ({ features, onToggle, autoToggleEnabled, onAutoToggleChange }) => {
  // Track which features were auto-enabled
  const [autoEnabled, setAutoEnabled] = useState({
    webSearch: false,
    documentAnalysis: false,
    imageUnderstanding: false,
    advancedReasoning: false,
    documentGeneration: false
  });

  // Check for newly auto-enabled features
  useEffect(() => {
    // Create a new state object instead of multiple state updates
    const newAutoEnabled = { ...autoEnabled };
    let hasChanges = false;

    Object.keys(features).forEach(key => {
      if (features[key] && !autoEnabled[key]) {
        // This feature was enabled but we didn't track it as auto-enabled yet
        // This means it was either manually toggled or auto-enabled
        newAutoEnabled[key] = true;
        hasChanges = true;
      } else if (!features[key] && autoEnabled[key]) {
        // Feature was turned off, reset auto-enabled state
        newAutoEnabled[key] = false;
        hasChanges = true;
      }
    });

    // Only update state if there are actual changes
    if (hasChanges) {
      setAutoEnabled(newAutoEnabled);
    }
  }, [features, autoEnabled]);

  // Handle manual toggle
  const handleToggle = (key) => {
    // Reset auto-enabled state when manually toggled
    setAutoEnabled(prev => ({
      ...prev,
      [key]: false
    }));
    onToggle(key);
  };

  return (
    <div className="feature-toggles">
      <div className="feature-toggles-container">
        <button
          className={`feature-toggle auto-toggle ${autoToggleEnabled ? 'active' : ''}`}
          onClick={() => onAutoToggleChange(!autoToggleEnabled)}
          title="Auto-Toggle Features"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 9V5C14 3.89543 13.1046 3 12 3C10.8954 3 10 3.89543 10 5V9M14 9C14 10.1046 13.1046 11 12 11C10.8954 11 10 10.1046 10 9M14 9H19C19.5523 9 20 9.44772 20 10V20C20 20.5523 19.5523 21 19 21H5C4.44772 21 4 20.5523 4 20V10C4 9.44772 4.44772 9 5 9H10"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="feature-label">{autoToggleEnabled ? 'Auto-Toggle On' : 'Auto-Toggle Off'}</span>
        </button>
        <button
          className={`feature-toggle ${features.webSearch ? 'active' : ''} ${autoEnabled.webSearch && features.webSearch ? 'auto-enabled' : ''}`}
          onClick={() => handleToggle('webSearch')}
          title="Web Search"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="feature-label">Web Search</span>
          {autoEnabled.webSearch && features.webSearch && <span className="auto-badge">Auto</span>}
        </button>

        <button
          className={`feature-toggle ${features.documentAnalysis ? 'active' : ''} ${autoEnabled.documentAnalysis && features.documentAnalysis ? 'auto-enabled' : ''}`}
          onClick={() => handleToggle('documentAnalysis')}
          title="Document Analysis"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="feature-label">Document Analysis</span>
          {autoEnabled.documentAnalysis && features.documentAnalysis && <span className="auto-badge">Auto</span>}
        </button>

        <button
          className={`feature-toggle ${features.imageUnderstanding ? 'active' : ''} ${autoEnabled.imageUnderstanding && features.imageUnderstanding ? 'auto-enabled' : ''}`}
          onClick={() => handleToggle('imageUnderstanding')}
          title="Image Understanding"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 16L8.58579 11.4142C9.36683 10.6332 10.6332 10.6332 11.4142 11.4142L16 16M14 14L15.5858 12.4142C16.3668 11.6332 17.6332 11.6332 18.4142 12.4142L20 14M14 8H14.01M6 20H18C19.1046 20 20 19.1046 20 18V6C20 4.89543 19.1046 4 18 4H6C4.89543 4 4 4.89543 4 6V18C4 19.1046 4.89543 20 6 20Z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="feature-label">Image Understanding</span>
          {autoEnabled.imageUnderstanding && features.imageUnderstanding && <span className="auto-badge">Auto</span>}
        </button>

        <button
          className={`feature-toggle ${features.advancedReasoning ? 'active' : ''} ${autoEnabled.advancedReasoning && features.advancedReasoning ? 'auto-enabled' : ''}`}
          onClick={() => handleToggle('advancedReasoning')}
          title="Advanced Reasoning"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M12 3L13.9101 4.87147L16.5 4.20577L17.2184 6.78155L19.7942 7.5L19.1285 10.0899L21 12L19.1285 13.9101L19.7942 16.5L17.2184 17.2184L16.5 19.7942L13.9101 19.1285L12 21L10.0899 19.1285L7.5 19.7942L6.78155 17.2184L4.20577 16.5L4.87147 13.9101L3 12L4.87147 10.0899L4.20577 7.5L6.78155 6.78155L7.5 4.20577L10.0899 4.87147L12 3Z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="feature-label">Advanced Reasoning</span>
          {autoEnabled.advancedReasoning && features.advancedReasoning && <span className="auto-badge">Auto</span>}
        </button>

        <button
          className={`feature-toggle ${features.documentGeneration ? 'active' : ''} ${autoEnabled.documentGeneration && features.documentGeneration ? 'auto-enabled' : ''}`}
          onClick={() => handleToggle('documentGeneration')}
          title="Document Generation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 7H17M7 12H17M7 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="feature-label">Document Generation</span>
          {autoEnabled.documentGeneration && features.documentGeneration && <span className="auto-badge">Auto</span>}
        </button>
      </div>
    </div>
  );
};

export default FeatureToggles;
