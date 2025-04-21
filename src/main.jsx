import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import './styles.css'
import './responsive.css'
import './accessibility.css'
import App from './App.jsx'
import SharedDocument from './components/SharedDocument'
import { preventPullToRefresh, preventDoubleTapZoom, isTouchDevice } from './utils/touchUtils'

// Wrapper component to handle mobile touch optimizations
const AppWrapper = () => {
  useEffect(() => {
    // Apply mobile touch optimizations
    if (isTouchDevice()) {
      // Prevent pull-to-refresh behavior on mobile
      preventPullToRefresh();

      // Prevent double-tap zoom on mobile
      preventDoubleTapZoom();

      // Add mobile class to body for CSS targeting
      document.body.classList.add('mobile-device');
    }

    // Add responsive viewport handling
    const handleResize = () => {
      // Set a CSS variable with the viewport height to handle mobile browser chrome
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    // Initial call
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/shared-document" element={<SharedDocument />} />
      </Routes>
    </BrowserRouter>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>,
)
