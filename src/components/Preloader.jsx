import { useState, useEffect } from 'react';
import './Preloader.css';

const Preloader = ({ onLoadComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing Apployd...');
  const [fadeOut, setFadeOut] = useState(false);

  // Loading messages to display during preloading
  const loadingMessages = [
    'Initializing Apployd...',
    'Loading language models...',
    'Preparing neural networks...',
    'Calibrating response systems...',
    'Setting up memory framework...',
    'Connecting to knowledge base...',
    'Optimizing user experience...',
    'Almost ready...'
  ];

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prevProgress => {
        // Calculate new progress
        const newProgress = prevProgress + Math.random() * 15;

        // Update loading message based on progress
        const messageIndex = Math.min(
          Math.floor(newProgress / 100 * loadingMessages.length),
          loadingMessages.length - 1
        );
        setLoadingText(loadingMessages[messageIndex]);

        // Check if loading is complete
        if (newProgress >= 100) {
          clearInterval(interval);
          setFadeOut(true);
          setTimeout(() => {
            if (onLoadComplete) onLoadComplete();
          }, 1000); // Wait for fade out animation
          return 100;
        }

        return newProgress;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [onLoadComplete]);

  return (
    <div className={`preloader ${fadeOut ? 'fade-out' : ''}`}>
      <div className="preloader-content">
        <div className="logo-container">
          <svg className="logo-svg" width="120" height="120" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="96" cy="96" r="96" fill="url(#paint0_linear)" />
            <path className="logo-path" d="M96 32L32 96L96 160L160 96L96 32Z" fill="url(#paint1_linear)" />
            <defs>
              <linearGradient id="paint0_linear" x1="0" y1="0" x2="192" y2="192" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7C5DFF" />
                <stop offset="1" stopColor="#4B3BBE" />
              </linearGradient>
              <linearGradient id="paint1_linear" x1="32" y1="32" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFFFF" />
                <stop offset="1" stopColor="#E0E0FF" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="pulse-effect"></div>
        </div>

        <h1 className="preloader-title">Apployd</h1>

        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{Math.round(progress)}%</div>
        </div>

        <div className="loading-text">{loadingText}</div>
      </div>
    </div>
  );
};

export default Preloader;
