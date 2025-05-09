import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSystemPrompt } from './systemPrompt';
import { generateContextualSystemMessage, addMessageToConversation } from './memoryService';
import { searchAndScrapeWeb } from './webSearchService';

// Initialize the Google Generative AI with your API key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Check if API key is provided
if (!apiKey) {
  console.error('ApploydAPI key is missing. Please add it to your .env file as VITE_GEMINI_API_KEY');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Get the Apploydmodel
// Using the latest stable model: gemini-2.0-flash
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Get the system prompt from a separate file to avoid syntax issues
// We'll prepend this to the user's message since system role is not supported
const SYSTEM_PROMPT = getSystemPrompt();

// Function to generate a chat response
export const generateChatResponse = async (prompt, history = []) => {
  try {
    // Validate history format
    if (history.length > 0 && history[0].role !== 'user') {
      console.warn('History must start with a user message. Removing invalid history.');
      history = [];
    }

    // Get contextual memories and information
    const contextualMemories = generateContextualSystemMessage(prompt);

    // Store the user message in memory
    addMessageToConversation({
      text: prompt,
      sender: 'user',
      timestamp: new Date().toISOString()
    });

    // If we have no valid history, just use the prompt directly
    if (history.length === 0) {
      // Prepend the system prompt and contextual memories to the user's message
      const enhancedSystemPrompt = `${SYSTEM_PROMPT}\n\n${contextualMemories ? `Context from memory:\n${contextualMemories}\n\n` : ''}`;
      const enhancedPrompt = enhancedSystemPrompt + prompt;

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: enhancedPrompt }] }
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      });

      const responseText = result.response.text();

      // Store the response in memory
      addMessageToConversation({
        text: responseText,
        sender: 'apployd',
        timestamp: new Date().toISOString()
      });

      return responseText;
    }

    // Start a chat session with valid history
    // For the first user message, prepend the system prompt and contextual memories
    let modifiedHistory = [...history];
    if (modifiedHistory.length > 0 && modifiedHistory[0].role === 'user') {
      // Prepend system prompt and contextual memories to the first user message
      const firstUserMessage = modifiedHistory[0];
      const enhancedSystemPrompt = `${SYSTEM_PROMPT}\n\n${contextualMemories ? `Context from memory:\n${contextualMemories}\n\n` : ''}`;
      modifiedHistory[0] = {
        role: 'user',
        parts: [{ text: enhancedSystemPrompt + firstUserMessage.parts[0].text }]
      };
    }

    const chat = model.startChat({
      history: modifiedHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });

    // Generate a response
    const result = await chat.sendMessage(prompt);
    const responseText = result.response.text();

    // Store the response in memory
    addMessageToConversation({
      text: responseText,
      sender: 'apployd',
      timestamp: new Date().toISOString()
    });

    return responseText;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
};

// Streaming function for chat response
export async function* streamChatResponse(prompt, history = []) {
  // Validate history format
  if (history.length > 0 && history[0].role !== 'user') {
    console.warn('History must start with a user message. Removing invalid history.');
    history = [];
  }

  // Get contextual memories and information
  const contextualMemories = generateContextualSystemMessage(prompt);

  // Store the user message in memory
  addMessageToConversation({
    text: prompt,
    sender: 'user',
    timestamp: new Date().toISOString()
  });

  try {
    let stream;

    // If we have valid history, use it with the chat model
    if (history.length > 0) {
      // Start a chat session with valid history
      // For the first user message, prepend the system prompt and contextual memories
      let modifiedHistory = [...history];
      if (modifiedHistory.length > 0 && modifiedHistory[0].role === 'user') {
        // Prepend system prompt and contextual memories to the first user message
        const firstUserMessage = modifiedHistory[0];
        const enhancedSystemPrompt = `${SYSTEM_PROMPT}\n\n${contextualMemories ? `Context from memory:\n${contextualMemories}\n\n` : ''}`;
        modifiedHistory[0] = {
          role: 'user',
          parts: [{ text: enhancedSystemPrompt + firstUserMessage.parts[0].text }]
        };
      }

      const chat = model.startChat({
        history: modifiedHistory,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      });

      // Generate a streaming response with the chat history
      stream = await chat.sendMessageStream(prompt);
    } else {
      // No history, use direct generation
      // Prepend the system prompt and contextual memories to the user's message
      const enhancedSystemPrompt = `${SYSTEM_PROMPT}\n\n${contextualMemories ? `Context from memory:\n${contextualMemories}\n\n` : ''}`;
      let enhancedPrompt = enhancedSystemPrompt + prompt;

      stream = await model.generateContentStream({
        contents: [
          { role: 'user', parts: [{ text: enhancedPrompt }] },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      });
    }

    let text = '';
    for await (const chunk of stream.stream) {
      text += chunk.text();
      yield text;
    }

    // Store the final response in memory
    addMessageToConversation({
      text: text,
      sender: 'apployd',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in streamChatResponse:', error);
    throw error;
  }
}

// Function to parse immersive content from the response
export const parseImmersiveContent = (response) => {
  const immersiveRegex = /<immersive>\s*id="([^"]+)"\s*type="([^"]+)"\s*title="([^"]+)"([\s\S]*?)<\/immersive>/g;
  const matches = [...response.matchAll(immersiveRegex)];

  if (matches.length === 0) {
    return null;
  }

  return matches.map((match) => {
    const [_, id, type, title, content] = match;
    return {
      id,
      type,
      title,
      content: content.trim(),
    };
  });
};

// Function to process images with Gemini
export const processImageWithGemini = async (imageFile, prompt) => {
  try {
    console.log('Processing image with Gemini:', imageFile.name, 'Prompt:', prompt);

    // Convert the image file to base64
    const base64Image = await fileToBase64(imageFile);
    console.log('Image converted to base64, length:', base64Image.length);

    // Create image part for the API
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: imageFile.type
      }
    };

    // Create a simplified prompt for image analysis with strict instructions for direct answers
    let enhancedPrompt;

    // Create a system instruction that will be prepended to any prompt
    const systemInstruction = "IMPORTANT: You must provide ONLY a direct analysis of the image without ANY explanation of your thought process. DO NOT list steps. DO NOT mention your methodology. DO NOT say phrases like 'I'll analyze' or 'I'll identify'. Just give the direct answer about what's in the image.";

    if (!prompt || prompt.trim() === '') {
      enhancedPrompt = `${systemInstruction}\n\nAnalyze this image and describe what you see.`;
    } else if (prompt.toLowerCase().includes('analyze') || prompt.toLowerCase().includes('what') || prompt.toLowerCase().includes('describe')) {
      // The prompt already contains analysis instructions
      enhancedPrompt = `${systemInstruction}\n\n${prompt}`;
    } else {
      // Add analysis instructions to the prompt
      enhancedPrompt = `${systemInstruction}\n\n${prompt}\n\nPlease analyze this image.`;
    }

    console.log('Enhanced prompt for image analysis:', enhancedPrompt);

    // Create a vision model that can process images
    // Use the pro-vision model which is specifically designed for image analysis
    const visionModel = genAI.getGenerativeModel({
      model: 'gemini-pro-vision'
    });

    console.log('Vision model created, sending request to ApploydAPI...');

    // Generate content with both text and image
    // Note: For vision models, we don't use the system prompt as it's not supported
    // We'll use a more structured approach to force direct answers
    const result = await visionModel.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: enhancedPrompt },
          imagePart
        ]
      }],
      generationConfig: {
        temperature: 0.4, // Lower temperature for more direct answers
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    console.log('Response received from ApploydAPI');
    let responseText = result.response.text();
    console.log('Response text length:', responseText.length);

    // Post-process the response to remove any thought process explanations
    responseText = postProcessImageResponse(responseText);
    console.log('Post-processed response length:', responseText.length);

    // Store the response in memory
    addMessageToConversation({
      text: responseText,
      sender: 'apployd',
      timestamp: new Date().toISOString()
    });

    return responseText;
  } catch (error) {
    console.error('Error processing image with Gemini:', error);
    // Provide more detailed error information
    if (error.message.includes('PERMISSION_DENIED')) {
      throw new Error('API key does not have permission to use the Vision model. Please check your API key permissions.');
    } else if (error.message.includes('INVALID_ARGUMENT')) {
      throw new Error('Invalid image format or size. Please try a different image.');
    } else if (error.message.includes('RESOURCE_EXHAUSTED')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else {
      throw error;
    }
  }
};

// Helper function to convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Converting file to base64:', file.name, file.type, file.size);
      const reader = new FileReader();

      reader.onload = () => {
        try {
          // Extract the base64 data from the data URL
          const dataUrl = reader.result;
          console.log('Data URL length:', dataUrl.length);

          // Verify the data URL format
          if (!dataUrl.startsWith('data:')) {
            reject(new Error('Invalid data URL format'));
            return;
          }

          const base64String = dataUrl.split(',')[1];
          console.log('Base64 string extracted, length:', base64String.length);
          resolve(base64String);
        } catch (extractError) {
          console.error('Error extracting base64 data:', extractError);
          reject(extractError);
        }
      };

      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        reject(error);
      };

      // Start reading the file
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error in fileToBase64:', error);
      reject(error);
    }
  });
};

// Function to post-process image responses to remove thought process explanations
const postProcessImageResponse = (text) => {
  // Remove phrases that indicate thought process
  let processed = text;

  // Remove "I'll analyze" and similar phrases
  processed = processed.replace(/I('ll| will) (analyze|examine|look at|identify|determine|assess|check|review|evaluate|break down|study)/gi, '');

  // Remove step indicators
  processed = processed.replace(/Step [0-9]+:?/gi, '');
  processed = processed.replace(/First,?|Second,?|Third,?|Finally,?|Next,?|Then,?/gi, '');

  // Remove methodology explanations
  processed = processed.replace(/My (analysis|approach|methodology|process|method) (is|will be)/gi, '');
  processed = processed.replace(/I('m| am) (going to|about to)/gi, '');

  // Remove "I can see" and similar phrases
  processed = processed.replace(/I (can|see|notice|observe|note|spot|detect)/gi, '');

  // Clean up any double spaces or extra line breaks created by the replacements
  processed = processed.replace(/\s+/g, ' ').trim();
  processed = processed.replace(/\n\s*\n/g, '\n').trim();

  return processed;
};

/**
 * Detect if a model response indicates uncertainty or lack of information
 * @param {string} text - The model's response text
 * @param {string} query - The original user query
 * @returns {Object} - Object containing uncertainty status and details
 */
export const detectUncertainty = (text, query = '') => {
  const uncertaintyPatterns = [
    /I don't have (enough|specific|detailed|current) information/i,
    /I don't have access to/i,
    /I'm not able to (provide|access|retrieve|find)/i,
    /I cannot (provide|access|retrieve|find|determine|verify)/i,
    /I'm (unable|not able) to/i,
    /I (don't|do not) (know|have knowledge of)/i,
    /I'm (not|unable to) (sure|certain)/i,
    /(without|lacking) (more|additional|specific) (information|context|details)/i,
    /my knowledge (is limited|has a cutoff)/i,
    /my training (data|cutoff)/i,
    /I (would need|need) (more|additional) (information|context|details)/i,
    /I (can't|cannot) (determine|verify|confirm|check)/i,
    /I'm not (familiar|updated|current) with/i,
    /that's (beyond|outside) (my|the scope of my)/i,
    /I (don't|do not) have (real-time|current|up-to-date)/i,
    /as of my (last update|training|knowledge cutoff)/i,
    /I (don't|do not) have the ability to/i,
    /I (don't|do not) have access to (real-time|current|up-to-date|the latest)/i,
    /I (can't|cannot) browse the (internet|web)/i,
    /I (can't|cannot) search the (internet|web|online)/i,
    /my information (might be|may be|is|could be) outdated/i,
    /for the most (current|up-to-date|recent) information/i,
    /you (might|may) want to (check|verify|look up|search)/i,
    /I (recommend|suggest) (checking|looking up|searching|visiting)/i
  ];

  // Check if any uncertainty pattern matches
  const isUncertain = uncertaintyPatterns.some(pattern => pattern.test(text));

  // Determine if the query is likely to benefit from web search/scraping
  const needsWebData = isUncertain && isQueryWebSearchable(query);

  return {
    isUncertain,
    needsWebData,
    originalResponse: text
  };
};

/**
 * Determine if a query would benefit from web search/scraping
 * @param {string} query - The user's query
 * @returns {boolean} - Whether the query is web-searchable
 */
const isQueryWebSearchable = (query) => {
  if (!query) return false;

  // Queries that likely need current information
  const currentInfoPatterns = [
    /what is/i,
    /who is/i,
    /where is/i,
    /when is/i,
    /how (to|do|does|can)/i,
    /latest/i,
    /recent/i,
    /current/i,
    /news/i,
    /update/i,
    /today/i,
    /yesterday/i,
    /this (week|month|year)/i,
    /happened/i,
    /released/i,
    /announced/i,
    /published/i,
    /launched/i,
    /stock price/i,
    /weather/i,
    /score/i,
    /result/i,
    /election/i,
    /price/i,
    /cost/i,
    /review/i,
    /comparison/i,
    /versus/i,
    /vs/i,
    /difference between/i
  ];

  return currentInfoPatterns.some(pattern => pattern.test(query));
};

/**
 * Get information from the web when the model is uncertain
 * @param {string} query - The user's query
 * @param {string} modelResponse - The model's initial response
 * @returns {Promise<string>} - Enhanced response with web information
 */
export const getWebInformationForUncertainty = async (query, modelResponse) => {
  try {
    console.log('Getting web information for uncertain response:', query);

    // Search and scrape the web for information
    const webData = await searchAndScrapeWeb(query);

    if (!webData || !webData.scrapedData || !webData.scrapedData.combinedResults) {
      console.log('No useful web data found');
      return modelResponse;
    }

    // Extract the most relevant information from scraped data
    const relevantInfo = extractRelevantInformation(webData, query);

    if (!relevantInfo) {
      console.log('No relevant information extracted from web data');
      return modelResponse;
    }

    // Generate a new response with the web information
    const enhancedResponse = await generateResponseWithWebInfo(query, relevantInfo, modelResponse);

    return enhancedResponse;
  } catch (error) {
    console.error('Error getting web information:', error);
    return modelResponse; // Fall back to the original response
  }
};

/**
 * Extract relevant information from scraped web data
 * @param {Object} webData - The scraped web data
 * @param {string} query - The user's query
 * @returns {string} - Extracted relevant information
 */
const extractRelevantInformation = (webData, query) => {
  try {
    const { combinedResults } = webData.scrapedData;

    // Combine information from all results
    let relevantInfo = '';

    // Add search result metadata
    relevantInfo += 'Web search results:\n';

    // Process each result
    combinedResults.forEach((result, index) => {
      // Add basic search result info
      relevantInfo += `${index + 1}. ${result.title}\n`;
      relevantInfo += `   Source: ${result.source}\n`;
      relevantInfo += `   URL: ${result.link}\n`;

      // Add snippet
      if (result.snippet) {
        relevantInfo += `   ${result.snippet}\n`;
      }

      // Add a sample of scraped content if available (limited to avoid token limits)
      if (result.scrapedContent) {
        const contentSample = result.scrapedContent.substring(0, 500) +
          (result.scrapedContent.length > 500 ? '...' : '');
        relevantInfo += `   Content: ${contentSample}\n`;
      }

      relevantInfo += '\n';
    });

    // Add the original query
    relevantInfo += `\n[User query]\n${query}`;

    return relevantInfo;
  } catch (error) {
    console.error('Error extracting relevant information:', error);
    return null;
  }
};

/**
 * Generate a new response using web information
 * @param {string} query - The user's query
 * @param {string} webInfo - The web information
 * @param {string} originalResponse - The model's original response
 * @returns {Promise<string>} - Enhanced response
 */
const generateResponseWithWebInfo = async (query, webInfo, originalResponse) => {
  try {
    // Create a prompt that instructs the model to use the web information
    const prompt = `${webInfo}\n\nUsing ONLY the web search results above, provide a comprehensive answer to the user's query. Do not mention that you're using search results in your answer. If the search results don't contain relevant information, acknowledge that you don't have enough information to answer accurately.`;

    // Generate a new response
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ],
      generationConfig: {
        temperature: 0.3, // Lower temperature for more factual responses
        topP: 0.8,
        topK: 40,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    });

    const enhancedResponse = result.response.text();

    // If the enhanced response is still uncertain, fall back to the original
    if (detectUncertainty(enhancedResponse).isUncertain) {
      console.log('Enhanced response still uncertain, falling back to original');
      return originalResponse;
    }

    return enhancedResponse;
  } catch (error) {
    console.error('Error generating response with web info:', error);
    return originalResponse; // Fall back to the original response
  }
};

// Function to generate content for the document editor
export const generateContent = async (prompt) => {
  try {
    // Use a simplified approach for document content generation
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    });

    return result.response.text();
  } catch (error) {
    console.error('Error generating content:', error);
    throw error;
  }
};

export default {
  generateChatResponse,
  parseImmersiveContent,
  streamChatResponse,
  processImageWithGemini,
  detectUncertainty,
  getWebInformationForUncertainty,
  generateContent
};
