import { useState, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import UserInput from './UserInput';
import ApiKeyStatus from './ApiKeyStatus';
import Sidebar from './Sidebar';
import FeatureToggles from './FeatureToggles';
import DocumentGenerator from './DocumentGenerator';
import { generateChatResponse, streamChatResponse, processImageWithGemini, detectUncertainty } from '../services/geminiService';
import { performWebSearch } from '../services/webSearchService';
import { suggestDocumentFormat } from '../services/documentService';
import { processGitHubCommand, isGitHubAuthenticated } from '../services/githubService';
import { processDatabaseCommand, isDatabaseConnected } from '../services/databaseService';
import '../responsive.css';

// Helper function to format search results for display
const formatSearchResults = (results) => {
  if (!results || results.length === 0) return '';

  return results.map((result, index) => {
    return `${index + 1}. ${result.title}\n   Source: ${result.source}\n   URL: ${result.link}\n   ${result.snippet}\n`;
  }).join('\n');
};

const ChatInterface = ({ onOpenSettings, onOpenDocumentEditor }) => {
  const [messages, setMessages] = useState([
    {
      id: 0,
      text: 'Hello! I\'m Apployd, an advanced AI assistant. How can I help you today?',
      sender: 'apployd',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 1024 && window.innerWidth > 768);
  const [isLoading, setIsLoading] = useState(false);
  const [features, setFeatures] = useState({
    webSearch: false,
    documentAnalysis: false,
    imageUnderstanding: false,
    advancedReasoning: false,
    documentGeneration: false
  });
  const [autoToggleEnabled, setAutoToggleEnabled] = useState(true); // Control whether features auto-toggle
  const [documentGeneratorVisible, setDocumentGeneratorVisible] = useState(false);
  const [selectedContent, setSelectedContent] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Smart scroll function that checks if user is already at the bottom
  const scrollToBottom = (force = false) => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;

    // Only auto-scroll if user is already at the bottom or if forced
    if ((shouldAutoScroll && isAtBottom) || force) {
      messagesEndRef.current?.scrollIntoView({ behavior: isGenerating ? 'auto' : 'smooth' });
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up scroll listener to detect when user manually scrolls away
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setShouldAutoScroll(isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      // On mobile, close sidebar by default
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
        setSidebarCollapsed(false);
      }
      // On tablets, collapse sidebar by default
      else if (window.innerWidth <= 1024) {
        setSidebarOpen(true);
        setSidebarCollapsed(true);
      }
      // On desktop, show full sidebar
      else {
        setSidebarOpen(true);
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle sidebar open/closed (for mobile)
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Toggle sidebar collapsed/expanded (for tablet)
  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Toggle features on/off
  const handleToggleFeature = (featureKey) => {
    // First check if the feature exists in our features object
    if (!(featureKey in features)) {
      console.warn(`Unknown feature key: ${featureKey}`);
      return;
    }

    // Get the new state before updating
    const newValue = !features[featureKey];

    // Update the features state
    setFeatures(prev => ({
      ...prev,
      [featureKey]: newValue
    }));

    // Add a system message when a feature is toggled
    const action = newValue ? 'enabled' : 'disabled';
    const featureNames = {
      webSearch: 'Web Search',
      documentAnalysis: 'Document Analysis',
      imageUnderstanding: 'Image Understanding',
      advancedReasoning: 'Advanced Reasoning',
      documentGeneration: 'Document Generation'
    };

    // Make sure we have a name for this feature
    const featureName = featureNames[featureKey] || featureKey;

    const systemMessage = {
      id: Date.now(),
      text: `${featureName} ${action}.`,
      sender: 'system',
      timestamp: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, systemMessage]);
  };

  // Toggle auto-toggle feature on/off
  const handleToggleAutoFeature = (newValue) => {
    setAutoToggleEnabled(newValue);

    // Add a system message about the auto-toggle setting change
    const systemMessage = {
      id: Date.now(),
      text: `Automatic feature toggling ${newValue ? 'enabled' : 'disabled'}.`,
      sender: 'system',
      timestamp: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, systemMessage]);
  };

  // Detect if a message is likely a search query
  const isSearchQuery = (text) => {
    // Check for short acronyms or abbreviations (2-5 characters)
    // These are often things the model might not know about
    if (/^(what|who|define|explain) (is|are) [A-Z0-9]{2,5}$/i.test(text)) {
      return true;
    }
    // First check if this is a personal question that can be answered from memory
    const personalQuestions = [
      /my name/i,
      /my (birthday|birth date)/i,
      /my (address|location|city|country)/i,
      /my (job|work|profession|occupation)/i,
      /my (hobby|hobbies|interests)/i,
      /my (family|children|spouse|partner|wife|husband)/i,
      /my (email|phone|contact)/i,
      /my (preference|favorite)/i,
      /do i like/i,
      /did i tell you/i,
      /have i mentioned/i,
      /what did i say about/i
    ];

    // If it's a personal question, don't trigger web search
    if (personalQuestions.some(pattern => pattern.test(text))) {
      return false;
    }

    // Check for common search patterns
    const searchPatterns = [
      // More specific search patterns that are less likely to be personal questions
      /(latest|recent|current|news about|update on)/i,
      /(stock price|market|economy|weather in|forecast for)/i,
      /(population of|capital of|distance between|convert|calculate)/i,
      /(history of|inventor of|creator of|founder of|origin of)/i,
      /(how to|steps to|guide for|tutorial on)/i,
      /(release date|when was|when will|upcoming|schedule)/i,
      /^(find|search for|look up|google)/i,
      // Trigger on common question formats that likely need external information
      /^(what|who|where|when) (is|are|was|were) (the|a|an) /i,
      // Simple definition questions like "what is mcp"
      /^what is [a-z0-9]+$/i,
      /^what are [a-z0-9]+$/i,
      /^who is [a-z0-9]+$/i,
      /^where is [a-z0-9]+$/i,
      // Acronym and abbreviation questions
      /^what does [a-z0-9]+ (mean|stand for)$/i,
      // Questions about specific entities that are likely not in the model's knowledge
      /^(what|who|where|when) (is|are|was|were) [a-z0-9]+ [a-z0-9]+$/i
    ];

    // Check if the query contains specific search indicators
    const containsSearchIndicators = searchPatterns.some(pattern => pattern.test(text));

    // Also check if it's a question (ends with question mark) AND is longer than 10 characters
    // This helps avoid triggering on simple personal questions
    const isComplexQuestion = /\?$/.test(text) && text.length > 10 &&
                             !text.toLowerCase().includes('my') &&
                             !text.toLowerCase().includes('i ');

    return containsSearchIndicators || isComplexQuestion;
  };

  // Detect if a message requires advanced reasoning
  const isReasoningQuery = (text) => {
    // Check if this is an image analysis query
    const imageAnalysisPatterns = [
      /analyze this image/i,
      /what('s| is) in (this|the) image/i,
      /describe (this|the) image/i,
      /tell me about (this|the) image/i,
      /what do you see in (this|the) image/i,
      /image analysis/i,
      /analyze image/i
    ];

    // If it's an image analysis query, don't trigger advanced reasoning
    if (imageAnalysisPatterns.some(pattern => pattern.test(text))) {
      return false;
    }

    // Check for patterns that suggest complex reasoning is needed
    const reasoningPatterns = [
      /(solve|calculate|compute|determine|evaluate|compare|contrast)/i, // removed 'analyze' from this pattern
      /(step by step|explain your reasoning|show your work|prove|demonstrate)/i,
      /(complex|complicated|difficult|challenging|advanced|intricate)/i,
      /(math|equation|formula|problem|theorem|proof|algorithm)/i,
      /(logic|logical|fallacy|argument|premise|conclusion|inference)/i
    ];

    return reasoningPatterns.some(pattern => pattern.test(text));
  };

  // Detect if a message is requesting document generation
  const isDocumentGenerationQuery = (text) => {
    // Check for patterns that suggest document generation is requested
    const documentPatterns = [
      /(generate|create|make|produce) (a|an|the) (pdf|document|excel|spreadsheet|word|doc)/i,
      /(export|save|download) (as|to) (pdf|excel|word|doc|document|spreadsheet)/i,
      /(convert|transform) (this|the|my) (text|content|data|information|response) (to|into) (a|an) (pdf|excel|word|doc)/i,
      /(can you|could you|please) (generate|create|make|produce) (a|an|the) (pdf|document|excel|spreadsheet|word|doc)/i,
      /(turn|change) (this|the|my|these) (into|to) (a|an) (pdf|document|excel|spreadsheet|word|doc)/i,
      /(pdf|excel|word|doc) (version|format|file)/i,
      /(download|save) (this|the|my) (as|in) (a|an) (file|document)/i,
      /^(genre|generate) document/i,
      /^(make|create) (a|an) document/i,
      /^document (about|on|for)/i,
      /^(write|draft) (a|an) (document|essay|report)/i,
      /^(pdf|doc|docx|word|excel) (this|it)/i
    ];

    return documentPatterns.some(pattern => pattern.test(text));
  };

  // Detect if a message is a GitHub command
  const isGitHubCommand = (text) => {
    // Check if GitHub is authenticated first
    if (!isGitHubAuthenticated()) {
      return false;
    }

    // Check for patterns that suggest GitHub commands
    const githubPatterns = [
      /^(list|show|my) repos/i,
      /^repo [\w-]+\/[\w-]+/i,
      /^[\w-]+\/[\w-]+ repo/i,
      /^(issues|issue list) [\w-]+\/[\w-]+/i,
      /^[\w-]+\/[\w-]+ (issues|issue list)/i,
      /^(pull requests|prs|pr list) [\w-]+\/[\w-]+/i,
      /^[\w-]+\/[\w-]+ (pull requests|prs|pr list)/i,
      /^(commits|commit history) [\w-]+\/[\w-]+/i,
      /^[\w-]+\/[\w-]+ (commits|commit history)/i,
      /^github/i
    ];

    return githubPatterns.some(pattern => pattern.test(text));
  };

  // Detect if a message is a database command
  const isDatabaseCommand = (text) => {
    // Check if database is connected first
    if (!isDatabaseConnected()) {
      return false;
    }

    // Check for patterns that suggest database commands
    const databasePatterns = [
      /^(query|sql) /i,
      /^(schema|show schema|database schema)$/i,
      /^(tables|show tables|list tables)$/i,
      /^(describe|desc) [\w_]+$/i,
      /^select .* from/i,
      /^insert into/i,
      /^update .* set/i,
      /^delete from/i,
      /^create table/i,
      /^alter table/i,
      /^database/i
    ];

    return databasePatterns.some(pattern => pattern.test(text));
  };

  // Handle document generation
  const handleDocumentGeneration = (content) => {
    setSelectedContent(content);
    setDocumentGeneratorVisible(true);
  };

  // Handle sending a message
  const handleSendMessage = async (message, uploadedFile = null) => {
    if (!message.trim()) return;

    // Add user message to the chat
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toISOString(),
      file: uploadedFile ? {
        name: uploadedFile.name,
        type: uploadedFile.type,
        size: uploadedFile.size
      } : null
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);
    setIsGenerating(true);

    // Force scroll to bottom when user sends a message
    setTimeout(() => scrollToBottom(true), 100);

    try {
      // Prepare message with active features information
      let enhancedMessage = message;
      const activeFeatures = Object.entries(features)
        .filter(([_, isActive]) => isActive)
        .map(([key]) => key);

      // Auto-enable features based on message content
      let autoEnabledSearch = false;
      let autoEnabledReasoning = false;

      // Auto-enable web search for search-like queries if auto-toggle is enabled
      if (autoToggleEnabled && !features.webSearch && isSearchQuery(message)) {
        // Automatically enable web search
        setFeatures(prev => ({ ...prev, webSearch: true }));
        autoEnabledSearch = true;

        // Add system message about auto-enabling search
        const autoEnableMessage = {
          id: Date.now() + 0.3,
          text: `Web Search automatically enabled for this query.`,
          sender: 'system',
          timestamp: new Date().toISOString(),
        };
        setMessages((prevMessages) => [...prevMessages, autoEnableMessage]);
      }

      // Auto-enable advanced reasoning for complex queries (but not for image analysis)
      // Check if this is an image upload - if so, don't auto-enable advanced reasoning
      const isImageUpload = uploadedFile && uploadedFile.type.includes('image');

      if (autoToggleEnabled && !features.advancedReasoning && isReasoningQuery(message) && !isImageUpload) {
        // Automatically enable advanced reasoning
        setFeatures(prev => ({ ...prev, advancedReasoning: true }));
        autoEnabledReasoning = true;

        // Add system message about auto-enabling reasoning
        const autoEnableMessage = {
          id: Date.now() + 0.35,
          text: `Advanced Reasoning automatically enabled for this query.`,
          sender: 'system',
          timestamp: new Date().toISOString(),
        };
        setMessages((prevMessages) => [...prevMessages, autoEnableMessage]);
      }

      // Auto-enable document generation for document requests
      let autoEnabledDocGen = false;
      if (autoToggleEnabled && !features.documentGeneration && isDocumentGenerationQuery(message)) {
        // Automatically enable document generation
        setFeatures(prev => ({ ...prev, documentGeneration: true }));
        autoEnabledDocGen = true;

        // Add system message about auto-enabling document generation
        const autoEnableMessage = {
          id: Date.now() + 0.36,
          text: `Document Generation automatically enabled for this query.`,
          sender: 'system',
          timestamp: new Date().toISOString(),
        };
        setMessages((prevMessages) => [...prevMessages, autoEnableMessage]);
      }

      // Handle GitHub commands
      if (isGitHubCommand(message)) {
        try {
          // Add a system message indicating GitHub command is being processed
          const processingMessage = {
            id: Date.now() + 0.37,
            text: `Processing GitHub command...`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          };
          setMessages((prevMessages) => [...prevMessages, processingMessage]);

          // Process the GitHub command
          const githubResponse = await processGitHubCommand(message);

          // Add the GitHub response as a Apploydmessage
          const githubMessage = {
            id: Date.now() + 1,
            text: githubResponse,
            sender: 'apployd',
            timestamp: new Date().toISOString(),
            isGitHubResponse: true
          };

          setMessages((prevMessages) => [...prevMessages, githubMessage]);
          setIsLoading(false);
          setIsGenerating(false);

          // Force scroll to bottom after GitHub response is complete
          setTimeout(() => scrollToBottom(true), 200);

          // Skip the regular text processing since we've already handled the GitHub command
          return;
        } catch (githubError) {
          console.error('Error processing GitHub command:', githubError);
          const errorMessage = {
            id: Date.now() + 0.38,
            text: `Error processing GitHub command: ${githubError.message}`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          };
          setMessages((prevMessages) => [...prevMessages, errorMessage]);
        }
      }

      // Handle database commands
      if (isDatabaseCommand(message)) {
        try {
          // Add a system message indicating database command is being processed
          const processingMessage = {
            id: Date.now() + 0.39,
            text: `Processing database command...`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          };
          setMessages((prevMessages) => [...prevMessages, processingMessage]);

          // Process the database command
          const databaseResponse = await processDatabaseCommand(message);

          // Add the database response as a Apploydmessage
          const databaseMessage = {
            id: Date.now() + 1,
            text: databaseResponse,
            sender: 'apployd',
            timestamp: new Date().toISOString(),
            isDatabaseResponse: true
          };

          setMessages((prevMessages) => [...prevMessages, databaseMessage]);
          setIsLoading(false);
          setIsGenerating(false);

          // Force scroll to bottom after database response is complete
          setTimeout(() => scrollToBottom(true), 200);

          // Skip the regular text processing since we've already handled the database command
          return;
        } catch (databaseError) {
          console.error('Error processing database command:', databaseError);
          const errorMessage = {
            id: Date.now() + 0.40,
            text: `Error processing database command: ${databaseError.message}`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          };
          setMessages((prevMessages) => [...prevMessages, errorMessage]);
        }
      }

      // Handle web search if enabled or auto-enabled
      let searchResults = [];
      if (features.webSearch || autoEnabledSearch) {
        try {
          // Add a system message indicating search is in progress
          const searchingMessage = {
            id: Date.now() + 0.5,
            text: `Searching the web for: "${message}"...`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          };
          setMessages((prevMessages) => [...prevMessages, searchingMessage]);

          // Perform the web search
          searchResults = await performWebSearch(message);

          // Format search results for display
          if (searchResults && searchResults.length > 0) {
            const searchResultsText = formatSearchResults(searchResults);
            // Create a more explicit prompt that forces the model to use the search results
            enhancedMessage = `[Web search results]\n${searchResultsText}\n\n[User query]\n${message}\n\nYou MUST answer the query using ONLY the information from the web search results above. Be direct and concise. Do not mention that you're using search results.`;

            // Add search results as a system message
            // Check if the first result is about the missing API key
            const isMissingApiKey = searchResults[0]?.title?.includes('API Key Missing');

            const resultsMessage = {
              id: Date.now() + 0.7,
              text: isMissingApiKey
                ? `⚠️ Using mock search results. To enable real web search, add a SerpApi key to your .env file.`
                : `Found ${searchResults.length} results for "${message}"`,
              sender: 'system',
              timestamp: new Date().toISOString(),
            };
            setMessages((prevMessages) => [...prevMessages, resultsMessage]);
          }
        } catch (error) {
          console.error('Web search error:', error);
          const errorMessage = {
            id: Date.now() + 0.6,
            text: `Error searching the web: ${error.message}`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          };
          setMessages((prevMessages) => [...prevMessages, errorMessage]);
        }
      }

      // Update the message with active features information
      if (activeFeatures.length > 0 || autoEnabledSearch || autoEnabledReasoning || autoEnabledDocGen) {
        // Get updated list of active features
        const updatedFeatures = Object.entries({
          ...features,
          webSearch: features.webSearch || autoEnabledSearch,
          advancedReasoning: features.advancedReasoning || autoEnabledReasoning,
          documentGeneration: features.documentGeneration || autoEnabledDocGen
        })
          .filter(([_, isActive]) => isActive)
          .map(([key]) => key);

        const featuresList = updatedFeatures.join(', ');

        // Only add the features prefix if we're not using search results directly
        if (!features.webSearch || searchResults.length === 0) {
          enhancedMessage = `[Active features: ${featuresList}] ${message}`;
        }

        // Add reasoning instructions if advanced reasoning is enabled
        if (features.advancedReasoning || autoEnabledReasoning) {
          enhancedMessage = `${enhancedMessage}\n\n[Please use step-by-step reasoning to solve this problem. Show your work clearly and explain each step of your thought process.]`;
        }
      }

      // Handle file upload if present
      if (uploadedFile) {
        const isImage = uploadedFile.type.includes('image');

        // Auto-enable image understanding or document analysis based on file type
        if (autoToggleEnabled && isImage && !features.imageUnderstanding) {
          // Auto-enable image understanding
          setFeatures(prev => ({ ...prev, imageUnderstanding: true }));

          // Add system message about auto-enabling image understanding
          const autoEnableMessage = {
            id: Date.now() + 0.4,
            text: `Image Understanding automatically enabled for this upload.`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          };
          setMessages((prevMessages) => [...prevMessages, autoEnableMessage]);

          // Add system message about direct answers for image analysis
          const directAnswerMessage = {
            id: Date.now() + 0.41,
            text: `Image analysis will provide ONLY direct answers with NO explanation of thought process.`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          };
          setMessages((prevMessages) => [...prevMessages, directAnswerMessage]);
        } else if (autoToggleEnabled && !isImage && !features.documentAnalysis) {
          // Auto-enable document analysis
          setFeatures(prev => ({ ...prev, documentAnalysis: true }));

          // Add system message about auto-enabling document analysis
          const autoEnableMessage = {
            id: Date.now() + 0.4,
            text: `Document Analysis automatically enabled for this upload.`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          };
          setMessages((prevMessages) => [...prevMessages, autoEnableMessage]);
        }

        // Format the message with file information
        if (isImage) {
          enhancedMessage = `[Image analysis requested] ${message}\nImage name: ${uploadedFile.name}\nImage type: ${uploadedFile.type}\nImage size: ${uploadedFile.size} bytes`;

          // For images, we'll use a different processing flow
          if (features.imageUnderstanding) {
            try {
              // Add a system message indicating image processing is in progress
              const processingMessage = {
                id: Date.now() + 0.45,
                text: `Processing image: ${uploadedFile.name}...`,
                sender: 'system',
                timestamp: new Date().toISOString(),
              };
              setMessages((prevMessages) => [...prevMessages, processingMessage]);

              // Create a more descriptive prompt if the user didn't provide one
              let imagePrompt = message;
              if (!message || message.trim() === '') {
                imagePrompt = 'Analyze this image and describe what you see.';

                // Add a system message about the default prompt
                const defaultPromptMessage = {
                  id: Date.now() + 0.46,
                  text: `Using default prompt: "${imagePrompt}"`,
                  sender: 'system',
                  timestamp: new Date().toISOString(),
                };
                setMessages((prevMessages) => [...prevMessages, defaultPromptMessage]);
              }

              // Add a system message about direct answers
              const directAnswerReminder = {
                id: Date.now() + 0.465,
                text: `Requesting direct analysis without explanation of thought process.`,
                sender: 'system',
                timestamp: new Date().toISOString(),
              };
              setMessages((prevMessages) => [...prevMessages, directAnswerReminder]);

              // If Advanced Reasoning was auto-enabled, disable it for image analysis
              if (features.advancedReasoning && !activeFeatures.includes('advancedReasoning')) {
                // This means Advanced Reasoning was auto-enabled during this request
                // Disable it for image analysis
                setFeatures(prev => ({ ...prev, advancedReasoning: false }));

                // Add system message about disabling Advanced Reasoning for image analysis
                const disableReasoningMessage = {
                  id: Date.now() + 0.47,
                  text: `Advanced Reasoning automatically disabled for image analysis.`,
                  sender: 'system',
                  timestamp: new Date().toISOString(),
                };
                setMessages((prevMessages) => [...prevMessages, disableReasoningMessage]);
              }

              // Process the image with ApploydVision model
              console.log('Sending image to Gemini API:', uploadedFile.name);
              const imageResponse = await processImageWithGemini(uploadedFile, imagePrompt);
              console.log('Received response from Gemini API, length:', imageResponse.length);

              // Update the Apploydmessage with the response
              apploydMessage = {
                id: Date.now() + 1,
                text: imageResponse,
                sender: 'apployd',
                timestamp: new Date().toISOString(),
                hasImage: true,
                imageName: uploadedFile.name
              };

              setMessages((prevMessages) => [...prevMessages, apploydMessage]);
              setIsLoading(false);
              setIsGenerating(false);

              // Force scroll to bottom after image response is complete
              setTimeout(() => scrollToBottom(true), 200);

              // Skip the regular text processing since we've already handled the image
              return;
            } catch (imageError) {
              console.error('Error processing image:', imageError);
              const errorMessage = {
                id: Date.now() + 0.46,
                text: `Error processing image: ${imageError.message}. Falling back to text description.`,
                sender: 'system',
                timestamp: new Date().toISOString(),
              };
              setMessages((prevMessages) => [...prevMessages, errorMessage]);

              // Add a more detailed error message for the user
              const userErrorMessage = {
                id: Date.now() + 0.47,
                text: "Image analysis failed. This could be due to API limits, image size, or format issues. I'll try to process your request as text instead.",
                sender: 'apployd',
                timestamp: new Date().toISOString(),
              };
              setMessages((prevMessages) => [...prevMessages, userErrorMessage]);

              // Continue with regular processing as fallback
            }
          }
        } else {
          enhancedMessage = `[Document analysis requested] ${message}\nDocument name: ${uploadedFile.name}\nDocument type: ${uploadedFile.type}\nDocument size: ${uploadedFile.size} bytes`;
        }
      }

      // Prepare conversation history for the API
      // Only include actual conversation messages (user and apployd), not system messages
      // Limit to the last 20 messages to avoid token limits
      const history = messages
        .filter((msg) => msg.sender === 'user' || msg.sender === 'apployd')
        .slice(-20) // Keep only the last 20 messages
        .map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        }));

      // Make sure history starts with a user message
      if (history.length > 0 && history[0].role !== 'user') {
        history.shift(); // Remove the first message if it's not from the user
      }

      // Streaming Apployd response
      let apploydMessage = {
        id: Date.now() + 1,
        text: '',
        sender: 'apployd',
        timestamp: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, apploydMessage]);
      let currentText = '';
      let messageId = apploydMessage.id;

      // Force scroll to bottom when AI starts responding
      setTimeout(() => scrollToBottom(true), 100);

      for await (const partial of streamChatResponse(enhancedMessage, history)) {
        currentText = partial;
        setMessages((prevMessages) => prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, text: currentText } : msg
        ));

        // Scroll to bottom during streaming if user is at the bottom
        scrollToBottom();

        // Check if the response indicates uncertainty and we should trigger web search
        // Only check once we have enough text to analyze (at least 100 characters)
        if (currentText.length > 100 &&
            autoToggleEnabled &&
            !features.webSearch &&
            !autoEnabledSearch &&
            detectUncertainty(currentText)) {

          // Add system message about auto-enabling search due to uncertainty
          const autoEnableMessage = {
            id: Date.now() + 0.31,
            text: `Web Search automatically enabled due to uncertainty in the response.`,
            sender: 'system',
            timestamp: new Date().toISOString(),
          };
          setMessages((prevMessages) => [...prevMessages, autoEnableMessage]);

          // Perform web search
          try {
            // Add a system message indicating search is in progress
            const searchingMessage = {
              id: Date.now() + 0.51,
              text: `Searching the web for: "${message}"...`,
              sender: 'system',
              timestamp: new Date().toISOString(),
            };
            setMessages((prevMessages) => [...prevMessages, searchingMessage]);

            // Perform the web search
            const searchResults = await performWebSearch(message);

            // Format search results for display
            if (searchResults && searchResults.length > 0) {
              const searchResultsText = formatSearchResults(searchResults);

              // Add search results as a system message
              const isMissingApiKey = searchResults[0]?.title?.includes('API Key Missing');

              const resultsMessage = {
                id: Date.now() + 0.71,
                text: isMissingApiKey
                  ? `⚠️ Using mock search results. To enable real web search, add a SerpApi key to your .env file.`
                  : `Found ${searchResults.length} results for "${message}"`,
                sender: 'system',
                timestamp: new Date().toISOString(),
              };
              setMessages((prevMessages) => [...prevMessages, resultsMessage]);

              // Create a new enhanced message with search results
              const newEnhancedMessage = `[Web search results]\n${searchResultsText}\n\n[User query]\n${message}\n\nYou MUST answer the query using ONLY the information from the web search results above. Be direct and concise. Do not mention that you're using search results.`;

              // Add a system message about generating a new response
              const regeneratingMessage = {
                id: Date.now() + 0.72,
                text: `Generating a new response with web search results...`,
                sender: 'system',
                timestamp: new Date().toISOString(),
              };
              setMessages((prevMessages) => [...prevMessages, regeneratingMessage]);

              // Remove the current incomplete message
              setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== messageId));

              // Create a new message for the improved response
              const newApploydMessage = {
                id: Date.now() + 2,
                text: '',
                sender: 'apployd',
                timestamp: new Date().toISOString(),
              };
              setMessages((prevMessages) => [...prevMessages, newApploydMessage]);

              // Stream the new response
              let newCurrentText = '';
              let newMessageId = newApploydMessage.id;

              // Force scroll to bottom for the new response
              setTimeout(() => scrollToBottom(true), 100);

              for await (const newPartial of streamChatResponse(newEnhancedMessage, [])) {
                newCurrentText = newPartial;
                setMessages((prevMessages) => prevMessages.map(msg =>
                  msg.id === newMessageId ? { ...msg, text: newCurrentText } : msg
                ));

                // Scroll to bottom during streaming if user is at the bottom
                scrollToBottom();
              }

              // Update the current text to the new response
              currentText = newCurrentText;
              messageId = newMessageId;

              // Break out of the original streaming loop
              break;
            }
          } catch (searchError) {
            console.error('Web search error during uncertainty handling:', searchError);
            const errorMessage = {
              id: Date.now() + 0.61,
              text: `Error searching the web: ${searchError.message}`,
              sender: 'system',
              timestamp: new Date().toISOString(),
            };
            setMessages((prevMessages) => [...prevMessages, errorMessage]);
          }
        }
      }

      // Check if document generation is enabled and the response is complete
      if (currentText && currentText.length > 0) {
        // Check if the user explicitly requested document generation
        if ((features.documentGeneration || autoEnabledDocGen) && isDocumentGenerationQuery(message)) {
          // Wait a moment to ensure the UI has updated with the complete response
          setTimeout(() => {
            // Add a system message about document generation
            const docGenMessage = {
              id: Date.now() + 0.8,
              text: 'Opening document generator...',
              sender: 'system',
              timestamp: new Date().toISOString(),
            };
            setMessages((prevMessages) => [...prevMessages, docGenMessage]);

            // Process the content for document generation
            let processedContent = currentText;

            // Check for immersive content format and extract the content
            if (currentText.includes('</immersive>')) {
              // Extract content from immersive tags
              const immersiveMatch = currentText.match(/(<\/immersive>\s*id="[^"]*"\s*type="[^"]*"\s*title="([^"]*)"[^>]*>)([\s\S]*?)(<\/immersive>)/i);

              if (immersiveMatch) {
                // Use the title and content from the immersive block
                const immersiveTitle = immersiveMatch[2];
                const immersiveContent = immersiveMatch[3];

                // Add a system message about the document title
                const titleMessage = {
                  id: Date.now() + 0.81,
                  text: `Document title: "${immersiveTitle}"`,
                  sender: 'system',
                  timestamp: new Date().toISOString(),
                };
                setMessages((prevMessages) => [...prevMessages, titleMessage]);

                // Use the immersive content for the document
                processedContent = immersiveContent;
              }
            }

            // Open the document generator with the processed content
            handleDocumentGeneration(processedContent);
          }, 1000); // 1 second delay
        }
      }
    } catch (error) {
      let errorText = 'Sorry, I encountered an error. Please try again.';
      if (error.message && error.message.includes('API key')) {
        errorText = 'Error: Invalid API key. Please check your API key in the .env file.';
      } else if (error.message && error.message.includes('network')) {
        errorText = 'Error: Network issue. Please check your internet connection.';
      } else if (error.message) {
        errorText = `Error: ${error.message}`;
      }
      const errorMessage = {
        id: Date.now() + 2,
        text: errorText,
        sender: 'apployd',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);

      // Final scroll to bottom after response is complete
      setTimeout(() => scrollToBottom(), 200);
    }
  };



  return (
    <div className="main-container chat-interface">
      {/* Mobile sidebar toggle button */}
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Sidebar with responsive states */}
      <div className={`sidebar ${!sidebarOpen ? '' : 'open'} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">Apployd</div>
          {/* Collapse toggle button for tablet view */}
          <button className="collapse-toggle" onClick={toggleSidebarCollapse}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <Sidebar onOpenSettings={onOpenSettings} onOpenDocumentEditor={onOpenDocumentEditor} />
      </div>

      <div className="chat-container">
        <ApiKeyStatus />
        <FeatureToggles
          features={features}
          onToggle={handleToggleFeature}
          autoToggleEnabled={autoToggleEnabled}
          onAutoToggleChange={handleToggleAutoFeature}
        />
        <MessageList messages={messages} ref={messagesContainerRef} />
        <div ref={messagesEndRef} />
        <UserInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>

      {/* Document Generator Modal */}
      <DocumentGenerator
        content={selectedContent}
        isVisible={documentGeneratorVisible}
        onClose={() => setDocumentGeneratorVisible(false)}
      />
    </div>
  );
};

export default ChatInterface;
