// Web search service using a simplified approach
// For a real implementation, you would use a proper search API

// Function to perform a web search
export const performWebSearch = async (query) => {
  console.log('Performing web search for:', query);

  try {
    // Add a delay to simulate a real search
    await new Promise(resolve => setTimeout(resolve, 1000));

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

export default {
  performWebSearch
};
