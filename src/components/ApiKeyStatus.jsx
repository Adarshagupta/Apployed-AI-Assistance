import { useState, useEffect } from 'react';

const ApiKeyStatus = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState('checking');

  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) {
        setApiKeyStatus('missing');
      } else if (apiKey === 'your_api_key_here') {
        setApiKeyStatus('placeholder');
      } else {
        setApiKeyStatus('valid');
      }
    };

    checkApiKey();
  }, []);

  if (apiKeyStatus === 'valid') {
    return null; // Don't show anything if the API key is valid
  }

  const isError = apiKeyStatus === 'missing' || apiKeyStatus === 'placeholder';

  return (
    <div className={`api-key-status ${isError ? 'error' : 'warning'}`}>
      {apiKeyStatus === 'missing' && (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '20px', width: '20px', marginRight: '12px', marginTop: '2px' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p style={{ fontWeight: '500', marginTop: 0, marginBottom: '4px' }}>API Key Missing</p>
            <p style={{ fontSize: '14px', margin: 0 }}>Please add your Gemini API key to the .env file as VITE_GEMINI_API_KEY.</p>
          </div>
        </div>
      )}

      {apiKeyStatus === 'placeholder' && (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '20px', width: '20px', marginRight: '12px', marginTop: '2px' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p style={{ fontWeight: '500', marginTop: 0, marginBottom: '4px' }}>API Key Not Set</p>
            <p style={{ fontSize: '14px', margin: 0 }}>You're using a placeholder API key. Please replace it with your actual Gemini API key in the .env file.</p>
          </div>
        </div>
      )}

      {apiKeyStatus === 'checking' && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="loading" style={{ height: '20px', width: '20px', marginRight: '12px' }}></div>
          <p style={{ margin: 0 }}>Checking API key status...</p>
        </div>
      )}
    </div>
  );
};

export default ApiKeyStatus;
