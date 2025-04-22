/**
 * Web Scraping Service
 *
 * This service provides functionality to scrape content from websites
 * when the LLM is unable to provide an answer.
 */

/**
 * Fetch HTML content from a URL
 * @param {string} url - The URL to fetch
 * @returns {Promise<string>} - The HTML content
 */
export const fetchWebContent = async (url) => {
  try {
    console.log('Fetching content from URL:', url);

    // Use a CORS proxy for client-side requests to bypass CORS restrictions
    const corsProxy = 'https://corsproxy.io/?';
    const fetchUrl = `${corsProxy}${encodeURIComponent(url)}`;

    const response = await fetch(fetchUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; ApploydAssistant/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error fetching web content:', error);
    throw error;
  }
};

/**
 * Extract main text content from HTML
 * @param {string} html - The HTML content
 * @returns {string} - The extracted text
 */
export const extractTextContent = (html) => {
  try {
    // Create a DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove script and style elements
    const scripts = doc.querySelectorAll('script, style, noscript, iframe, svg');
    scripts.forEach(script => script.remove());

    // Focus on main content areas
    const mainContent = doc.querySelector('main, article, #content, .content, #main, .main');

    // If we found a main content area, use that, otherwise use body
    const contentElement = mainContent || doc.body;

    // Get text content
    let text = contentElement.textContent || '';

    // Clean up the text
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  } catch (error) {
    console.error('Error extracting text content:', error);
    return '';
  }
};

/**
 * Extract structured data from HTML (title, meta description, etc.)
 * @param {string} html - The HTML content
 * @returns {Object} - The extracted structured data
 */
export const extractStructuredData = (html) => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract title
    const title = doc.querySelector('title')?.textContent || '';

    // Extract meta description
    const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    // Extract headings
    const headings = Array.from(doc.querySelectorAll('h1, h2, h3'))
      .map(h => h.textContent.trim())
      .filter(h => h.length > 0);

    // Extract JSON-LD structured data if available
    let jsonLdData = [];
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        jsonLdData.push(data);
      } catch (e) {
        // Ignore parsing errors
      }
    });

    return {
      title,
      metaDescription,
      headings,
      jsonLdData
    };
  } catch (error) {
    console.error('Error extracting structured data:', error);
    return {
      title: '',
      metaDescription: '',
      headings: [],
      jsonLdData: []
    };
  }
};

/**
 * Scrape content from a URL
 * @param {string} url - The URL to scrape
 * @returns {Promise<Object>} - The scraped content
 */
export const scrapeWebsite = async (url) => {
  try {
    // Fetch the HTML content
    const html = await fetchWebContent(url);

    // Extract text content
    const textContent = extractTextContent(html);

    // Extract structured data
    const structuredData = extractStructuredData(html);

    return {
      url,
      textContent,
      ...structuredData,
      scrapedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error scraping website:', error);
    throw error;
  }
};

/**
 * Scrape multiple websites and combine the results
 * @param {string[]} urls - Array of URLs to scrape
 * @returns {Promise<Object[]>} - Array of scraped content
 */
export const scrapeMultipleWebsites = async (urls) => {
  try {
    // Limit the number of URLs to scrape to avoid overloading
    const limitedUrls = urls.slice(0, 3);

    // Scrape each URL in parallel
    const results = await Promise.all(
      limitedUrls.map(url => scrapeWebsite(url).catch(error => ({
        url,
        error: error.message,
        scrapedAt: new Date().toISOString()
      })))
    );

    return results;
  } catch (error) {
    console.error('Error scraping multiple websites:', error);
    throw error;
  }
};

/**
 * Process search results and scrape the most relevant websites
 * @param {Array} searchResults - Array of search results from webSearchService
 * @returns {Promise<Object>} - Combined scraped content
 */
export const processSearchResultsAndScrape = async (searchResults) => {
  try {
    if (!searchResults || searchResults.length === 0) {
      throw new Error('No search results provided');
    }

    // Extract URLs from search results
    const urls = searchResults
      .filter(result => result.link)
      .map(result => result.link);

    // Scrape the websites
    const scrapedResults = await scrapeMultipleWebsites(urls);

    // Combine the search results with the scraped content
    const combinedResults = searchResults.map((searchResult, index) => {
      const scrapedResult = scrapedResults.find(r => r.url === searchResult.link) || {};

      return {
        ...searchResult,
        scrapedContent: scrapedResult.textContent || '',
        structuredData: {
          title: scrapedResult.title || searchResult.title,
          description: scrapedResult.metaDescription || searchResult.snippet,
          headings: scrapedResult.headings || []
        }
      };
    });

    return {
      combinedResults,
      scrapedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error processing search results and scraping:', error);
    throw error;
  }
};

/**
 * Direct scraping function for use from the chat interface
 * @param {string} url - The URL to scrape
 * @returns {Promise<string>} - A formatted summary of the scraped content
 */
export const directScrapeUrl = async (url) => {
  try {
    console.log('Direct scraping URL:', url);

    // Validate URL format
    if (!url.match(/^https?:\/\//)) {
      url = 'https://' + url;
    }

    // Scrape the website
    const scrapedData = await scrapeWebsite(url);

    // Format the results for display
    let formattedResult = `# Scraped Content from ${url}\n\n`;

    // Add title and description
    if (scrapedData.title) {
      formattedResult += `## Title\n${scrapedData.title}\n\n`;
    }

    if (scrapedData.metaDescription) {
      formattedResult += `## Description\n${scrapedData.metaDescription}\n\n`;
    }

    // Add headings if available
    if (scrapedData.headings && scrapedData.headings.length > 0) {
      formattedResult += `## Main Headings\n${scrapedData.headings.join('\n')}\n\n`;
    }

    // Add a sample of the text content
    if (scrapedData.textContent) {
      // Limit to first 1000 characters to avoid overwhelming the user
      const contentSample = scrapedData.textContent.substring(0, 1000) +
        (scrapedData.textContent.length > 1000 ? '...' : '');
      formattedResult += `## Content Sample\n${contentSample}\n\n`;
    }

    formattedResult += `*Scraped at: ${new Date().toLocaleString()}*`;

    return formattedResult;
  } catch (error) {
    console.error('Error in direct scraping:', error);
    return `Error scraping ${url}: ${error.message}`;
  }
};

export default {
  fetchWebContent,
  extractTextContent,
  extractStructuredData,
  scrapeWebsite,
  scrapeMultipleWebsites,
  processSearchResultsAndScrape,
  directScrapeUrl
};
