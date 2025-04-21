/**
 * Touch utilities for better mobile experience
 */

// Detect if the device supports touch events
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Add swipe detection to an element
export const addSwipeDetection = (element, onSwipeLeft, onSwipeRight) => {
  if (!element) return;
  
  let touchStartX = 0;
  let touchEndX = 0;
  const minSwipeDistance = 50; // Minimum distance for a swipe to be detected
  
  const handleTouchStart = (e) => {
    touchStartX = e.touches[0].clientX;
  };
  
  const handleTouchMove = (e) => {
    touchEndX = e.touches[0].clientX;
  };
  
  const handleTouchEnd = () => {
    const swipeDistance = touchEndX - touchStartX;
    
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && onSwipeRight) {
        // Swiped right
        onSwipeRight();
      } else if (swipeDistance < 0 && onSwipeLeft) {
        // Swiped left
        onSwipeLeft();
      }
    }
    
    // Reset values
    touchStartX = 0;
    touchEndX = 0;
  };
  
  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });
  
  // Return a cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
};

// Add pull-to-refresh prevention
export const preventPullToRefresh = () => {
  document.body.addEventListener('touchmove', (e) => {
    if (window.scrollY === 0 && e.touches[0].clientY > 0) {
      e.preventDefault();
    }
  }, { passive: false });
};

// Add double-tap prevention (prevents accidental zooming)
export const preventDoubleTapZoom = () => {
  let lastTap = 0;
  document.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
      e.preventDefault();
    }
    
    lastTap = currentTime;
  }, { passive: false });
};
