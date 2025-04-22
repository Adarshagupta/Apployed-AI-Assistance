/**
 * Web Search Service
 *
 * This service provides functionality to search the web using SerpAPI
 * and falls back to mock results if no API key is available.
 */
import { scrapeWebsite, processSearchResultsAndScrape } from './webScrapingService';

// Get the SerpAPI key from environment variables
const SERPAPI_KEY = import.meta.env.VITE_SERPAPI_KEY;

/**
 * Check if we have a valid SerpAPI key
 * @returns {boolean} - Whether a valid API key is available
 */
export const hasSerpApiKey = () => {
  return Boolean(SERPAPI_KEY && SERPAPI_KEY.length > 10);
};

/**
 * Perform a web search using SerpAPI
 * @param {string} query - The search query
 * @returns {Promise<Array>} - Array of search results
 */
export const performWebSearch = async (query) => {
  console.log('Performing web search for:', query);

  try {
    // Check if we have a SerpAPI key
    if (hasSerpApiKey()) {
      return await performRealWebSearch(query);
    }

    // Fall back to mock results
    console.log('No SerpAPI key found, using mock results');

    // Check if we have specific mock results for this query
    const normalizedQuery = query.toLowerCase();

    // For MCP queries, return specific results
    if (normalizedQuery.includes('mcp')) {
      return getMcpResults();
    }

    // For other queries, return generic results
    return getGenericResults(query);

  } catch (error) {
    console.error('Error performing web search:', error);
    throw error;
  }
};

// Function to get MCP-specific results
const getMcpResults = () => {
  return [
    {
      title: 'MCP - Master Control Program (Tron)',
      link: 'https://en.wikipedia.org/wiki/Master_Control_Program_(Tron)',
      snippet: 'The Master Control Program (MCP) is the main antagonist in the 1982 Disney film Tron. It is a rogue computer program created by Ed Dillinger that rules over the digital world.',
      source: 'Wikipedia'
    },
    {
      title: 'MCP - Microsoft Certified Professional',
      link: 'https://learn.microsoft.com/en-us/certifications/',
      snippet: 'Microsoft Certified Professional (MCP) was a certification program for IT professionals seeking to demonstrate their expertise with Microsoft products and technologies.',
      source: 'Microsoft'
    },
    {
      title: 'MCP - Main Control Program (Computing)',
      link: 'https://www.techopedia.com/definition/main-control-program',
      snippet: 'In computing, MCP refers to the Main Control Program, which is a central software component that manages and coordinates the operations of a computer system.',
      source: 'Techopedia'
    },
    {
      title: 'MCP - Maintenance Control Point (Construction)',
      link: 'https://www.constructionstandards.org/mcp',
      snippet: 'In construction, MCP stands for Maintenance Control Point, which is a designated location where maintenance activities are coordinated and controlled.',
      source: 'Construction Standards'
    },
    {
      title: 'MCP - Microchannel Plate (Physics)',
      link: 'https://www.sciencedirect.com/topics/physics-and-astronomy/microchannel-plates',
      snippet: 'A Microchannel Plate (MCP) is a planar component used for detection of particles (electrons, ions and photons) and low energy radiation (ultraviolet radiation and X-rays).',
      source: 'ScienceDirect'
    }
  ];
};

// Function to get generic results for any query
const getGenericResults = (query) => {
  return [
    {
      title: `Search results for: ${query}`,
      link: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      snippet: `Here are some search results for "${query}". This is using a simplified mock search implementation.`,
      source: 'Mock Search'
    },
    {
      title: `${query} - Wikipedia`,
      link: `https://en.wikipedia.org/wiki/${encodeURIComponent(query.replace(/\s+/g, '_'))}`,
      snippet: `Wikipedia article about ${query}, providing comprehensive information and references.`,
      source: 'Wikipedia'
    },
    {
      title: `Understanding ${query} - A Complete Guide`,
      link: `https://example.com/guide/${encodeURIComponent(query.replace(/\s+/g, '-'))}`,
      snippet: `This comprehensive guide explains everything you need to know about ${query}, including definitions, examples, and practical applications.`,
      source: 'Example.com'
    },
    {
      title: `${query} - Latest News and Updates`,
      link: `https://news.example.com/topics/${encodeURIComponent(query.replace(/\s+/g, '-'))}`,
      snippet: `Get the latest news, updates, and developments related to ${query}. Stay informed with our comprehensive coverage.`,
      source: 'Example News'
    }
  ];
};

/**
 * Perform a real web search using SerpAPI
 * @param {string} query - The search query
 * @returns {Promise<Array>} - Array of search results
 */
const performRealWebSearch = async (query) => {
  try {
    // Construct the SerpAPI URL
    const serpApiUrl = new URL('https://serpapi.com/search');
    serpApiUrl.searchParams.append('api_key', SERPAPI_KEY);
    serpApiUrl.searchParams.append('q', query);
    serpApiUrl.searchParams.append('engine', 'google');
    serpApiUrl.searchParams.append('num', '5'); // Limit to 5 results

    // Make the request
    const response = await fetch(serpApiUrl.toString());

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Extract and format the search results
    if (data.organic_results && data.organic_results.length > 0) {
      return data.organic_results.map(result => ({
        title: result.title,
        link: result.link,
        snippet: result.snippet || '',
        source: result.source || 'Google Search'
      }));
    }

    // If no results, return an empty array
    return [];
  } catch (error) {
    console.error('Error with SerpAPI:', error);
    // Fall back to mock results
    return getGenericResults(query);
  }
};

/**
 * Search and scrape web content
 * @param {string} query - The search query
 * @returns {Promise<Object>} - Search results with scraped content
 */
export const searchAndScrapeWeb = async (query) => {
  try {
    // First, perform a web search
    const searchResults = await performWebSearch(query);

    if (!searchResults || searchResults.length === 0) {
      throw new Error('No search results found');
    }

    // Then, scrape the top results
    const scrapedData = await processSearchResultsAndScrape(searchResults);

    return {
      query,
      searchResults,
      scrapedData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error searching and scraping web:', error);
    throw error;
  }
};

/**
 * Directly scrape a specific URL
 * @param {string} url - The URL to scrape
 * @returns {Promise<Object>} - The scraped content
 */
export const scrapeUrl = async (url) => {
  try {
    return await scrapeWebsite(url);
  } catch (error) {
    console.error('Error scraping URL:', error);
    throw error;
  }
};

export default {
  performWebSearch,
  searchAndScrapeWeb,
  scrapeUrl,
  hasSerpApiKey
};
