/**
 * Service for document sharing functionality
 */

/**
 * Generate a shareable link for a document
 * @param {Object} document - The document to share
 * @returns {string} - The shareable link
 */
export const generateShareableLink = (document) => {
  try {
    // Create a document object with only necessary data
    const shareableDoc = {
      id: document.id,
      title: document.title,
      content: document.content,
      lastModified: document.lastModified,
      createdBy: 'Apployd User', // In a real app, this would be the actual user
      shareDate: new Date().toISOString()
    };
    
    // Encode the document data
    const encodedData = btoa(JSON.stringify(shareableDoc));
    
    // Create a shareable link with the encoded data
    // In a real app, this would likely be a backend API endpoint
    const shareableLink = `${window.location.origin}/shared-document?data=${encodedData}`;
    
    return shareableLink;
  } catch (error) {
    console.error('Error generating shareable link:', error);
    throw error;
  }
};

/**
 * Share document via email
 * @param {string} email - Email address to share with
 * @param {string} link - Shareable link
 * @param {string} title - Document title
 * @returns {boolean} - Success status
 */
export const shareViaEmail = (email, link, title) => {
  try {
    // In a real app, this would call a backend API to send an email
    // For now, we'll open the user's email client with a pre-filled message
    
    const subject = encodeURIComponent(`Shared Document: ${title}`);
    const body = encodeURIComponent(
      `Hello,\n\nI'm sharing a document with you: "${title}"\n\nYou can view it here: ${link}\n\nRegards,\nApployd User`
    );
    
    // Open the default email client
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
    
    return true;
  } catch (error) {
    console.error('Error sharing via email:', error);
    throw error;
  }
};

/**
 * Copy shareable link to clipboard
 * @param {string} link - Shareable link
 * @returns {Promise<boolean>} - Success status
 */
export const copyLinkToClipboard = async (link) => {
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch (error) {
    console.error('Error copying link to clipboard:', error);
    throw error;
  }
};

export default {
  generateShareableLink,
  shareViaEmail,
  copyLinkToClipboard
};
