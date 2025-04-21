import { useState, useEffect } from 'react'
import ChatInterface from './components/ChatInterface'
import MemoryPanel from './components/MemoryPanel'
import Settings from './components/Settings'
import Preloader from './components/Preloader'
import { initializeMemory } from './services/memoryService'

function App() {
  // State to control settings visibility and loading state
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize memory system on app load
  useEffect(() => {
    initializeMemory();

    // Check if this is the first visit or if we should show the preloader
    const hasVisitedBefore = localStorage.getItem('has_visited_before');
    if (hasVisitedBefore === 'true') {
      // Skip preloader for returning users
      setIsLoading(false);
    }

    // Set the visited flag for future visits
    localStorage.setItem('has_visited_before', 'true');

    // Apply any saved theme settings
    applyStoredThemeSettings();
  }, []);

  // Function to apply stored theme settings
  const applyStoredThemeSettings = () => {
    // Apply theme mode
    const themeMode = localStorage.getItem('theme_mode') || 'dark';
    document.documentElement.setAttribute('data-theme', themeMode);

    // Apply accent color
    const accentColor = localStorage.getItem('accent_color') || 'purple';
    let primaryColor = '#7c5dff';
    let primaryLightColor = '#9a85ff';

    switch (accentColor) {
      case 'blue':
        primaryColor = '#4285f4';
        primaryLightColor = '#5e97f5';
        break;
      case 'green':
        primaryColor = '#0f9d58';
        primaryLightColor = '#1fb978';
        break;
      case 'red':
        primaryColor = '#db4437';
        primaryLightColor = '#e25a4e';
        break;
    }

    document.documentElement.style.setProperty('--gemini-primary', primaryColor);
    document.documentElement.style.setProperty('--gemini-primary-light', primaryLightColor);

    // Apply font size
    const fontSize = localStorage.getItem('font_size') || 'medium';
    let baseFontSize = '16px';

    switch (fontSize) {
      case 'small':
        baseFontSize = '14px';
        break;
      case 'large':
        baseFontSize = '18px';
        break;
    }

    document.documentElement.style.setProperty('--base-font-size', baseFontSize);

    // Apply accessibility settings
    if (localStorage.getItem('reduced_motion') === 'true') {
      document.documentElement.classList.add('reduced-motion');
    }

    if (localStorage.getItem('high_contrast') === 'true') {
      document.documentElement.classList.add('high-contrast');
    }
  };

  // Function to toggle settings visibility
  const toggleSettings = () => {
    setShowSettings(prev => !prev);
  };

  // Function to handle preloader completion
  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  return (
    <div className="app-container">
      {isLoading ? (
        <Preloader onLoadComplete={handleLoadComplete} />
      ) : (
        <>
          <ChatInterface onOpenSettings={toggleSettings} />
          <MemoryPanel />
          {showSettings && <Settings onClose={toggleSettings} />}
        </>
      )}
    </div>
  )
}

export default App
