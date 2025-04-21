/**
 * Utility functions for date handling
 */

/**
 * Get the current date in YYYY-MM-DD format
 * @returns {string} - The current date
 */
export const getCurrentDate = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

/**
 * Format a date string in a human-readable format
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Get the current time in a human-readable format
 * @returns {string} - Formatted time
 */
export const getCurrentTime = () => {
  const date = new Date();
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
};
