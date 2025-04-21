// Memory Service for ApploydClone
// Handles storing, retrieving, and managing conversation memory and learned information

import { v4 as uuidv4 } from 'uuid';

// Memory types
const MEMORY_TYPES = {
  CONVERSATION: 'conversation',  // Regular conversation history
  LEARNED_FACT: 'learned_fact',  // Important facts learned from user
  USER_PREFERENCE: 'user_preference',  // User preferences
  CONTEXT: 'context',  // Contextual information
  IMPORTANT: 'important'  // Explicitly marked as important by the system
};

// In-memory storage (will be replaced with localStorage/IndexedDB in production)
let memoryStore = {
  memories: [],
  conversations: {},
  currentConversationId: null
};

// Initialize memory system
const initializeMemory = () => {
  // Try to load from localStorage if available
  try {
    const savedMemory = localStorage.getItem('apployd_memory');
    if (savedMemory) {
      memoryStore = JSON.parse(savedMemory);
    }

    // If no current conversation, create one
    if (!memoryStore.currentConversationId) {
      createNewConversation();
    }
  } catch (error) {
    console.error('Error initializing memory:', error);
    // Reset memory if there's an error
    resetMemory();
  }
};

// Save memory to localStorage
const saveMemoryToStorage = () => {
  try {
    localStorage.setItem('apployd_memory', JSON.stringify(memoryStore));
  } catch (error) {
    console.error('Error saving memory to storage:', error);
  }
};

// Reset memory
const resetMemory = () => {
  memoryStore = {
    memories: [],
    conversations: {},
    currentConversationId: null
  };
  createNewConversation();
  saveMemoryToStorage();
};

// Create a new conversation
const createNewConversation = () => {
  const conversationId = uuidv4();
  memoryStore.conversations[conversationId] = {
    id: conversationId,
    messages: [],
    title: 'New Conversation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    context: {},
    summary: ''
  };
  memoryStore.currentConversationId = conversationId;
  saveMemoryToStorage();
  return conversationId;
};

// Switch to a different conversation
const switchConversation = (conversationId) => {
  if (memoryStore.conversations[conversationId]) {
    memoryStore.currentConversationId = conversationId;
    saveMemoryToStorage();
    return true;
  }
  return false;
};

// Get current conversation
const getCurrentConversation = () => {
  if (!memoryStore.currentConversationId) {
    createNewConversation();
  }
  return memoryStore.conversations[memoryStore.currentConversationId];
};

// Get all conversations
const getAllConversations = () => {
  return Object.values(memoryStore.conversations).sort((a, b) =>
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );
};

// Add message to current conversation
const addMessageToConversation = (message) => {
  const conversation = getCurrentConversation();
  conversation.messages.push({
    ...message,
    timestamp: message.timestamp || new Date().toISOString()
  });
  conversation.updatedAt = new Date().toISOString();

  // Update conversation title if it's the first user message
  if (conversation.messages.length === 2 && message.sender === 'user') {
    // Use the first user message as the conversation title (truncated)
    conversation.title = message.text.length > 30
      ? message.text.substring(0, 30) + '...'
      : message.text;
  }

  // Analyze message for important information
  if (message.sender === 'user') {
    analyzeMessageForMemories(message.text);

    // Analyze for conversation context
    analyzeMessageForContext(message.text);
  }

  // If it's a response from Apployd, analyze for consistency tracking
  if (message.sender === 'apployd') {
    trackResponseConsistency(message.text);
  }

  saveMemoryToStorage();
  return conversation;
};

// Analyze message for conversation context
const analyzeMessageForContext = (text) => {
  // Track conversation topics
  const topicPatterns = [
    { pattern: /(?:talk|discuss|tell me) about (.*?)(?:\.|$)/i, contextKey: 'currentTopic' },
    { pattern: /(?:explain|describe) (.*?)(?:\.|$)/i, contextKey: 'currentTopic' },
    { pattern: /(?:how|what|why|when|where|who) (?:is|are|was|were) (.*?)(?:\?|$)/i, contextKey: 'currentTopic' }
  ];

  // Check for topic changes
  for (const { pattern, contextKey } of topicPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].length > 3) {
      const topic = match[1].trim();
      // Only update if it's a significant topic (more than 3 chars)
      addContextToConversation(contextKey, topic);

      // Also track previous topics for continuity
      const previousTopics = getContextFromConversation('previousTopics') || '';
      const topicsArray = previousTopics ? previousTopics.split(',') : [];
      if (!topicsArray.includes(topic)) {
        topicsArray.push(topic);
        // Keep only the last 5 topics
        if (topicsArray.length > 5) {
          topicsArray.shift();
        }
        addContextToConversation('previousTopics', topicsArray.join(','));
      }
    }
  }

  // Track user sentiment/mood
  const sentimentPatterns = [
    { pattern: /(?:i am|i'm) (?:happy|excited|glad|pleased|delighted)/i, sentiment: 'positive' },
    { pattern: /(?:i am|i'm) (?:sad|upset|angry|frustrated|disappointed)/i, sentiment: 'negative' },
    { pattern: /(?:i am|i'm) (?:confused|unsure|uncertain)/i, sentiment: 'confused' },
    { pattern: /(?:i am|i'm) (?:curious|interested|intrigued)/i, sentiment: 'curious' }
  ];

  for (const { pattern, sentiment } of sentimentPatterns) {
    if (pattern.test(text)) {
      addContextToConversation('userSentiment', sentiment);
      break;
    }
  }

  // Track conversation complexity
  const wordCount = text.split(/\s+/).length;
  const avgWordLength = text.replace(/[^\w\s]/g, '').split(/\s+/).reduce((sum, word) => sum + word.length, 0) / wordCount || 0;

  // Estimate complexity based on word count and average word length
  let complexity = 'simple';
  if (wordCount > 30 || avgWordLength > 6) {
    complexity = 'moderate';
  }
  if (wordCount > 50 || avgWordLength > 7) {
    complexity = 'complex';
  }

  addContextToConversation('conversationComplexity', complexity);

  // Track if user is asking for code
  const codePatterns = [
    /(?:write|create|generate|give me) (?:a|some|the) code/i,
    /(?:write|create|generate) (?:a|an) (?:function|class|program|script|app|application)/i,
    /(?:how|can you) (?:code|program|implement|develop)/i,
    /(?:html|css|javascript|python|java|c\+\+|php|ruby|swift|kotlin|go|rust)/i
  ];

  if (codePatterns.some(pattern => pattern.test(text))) {
    addContextToConversation('userWantsCode', 'true');
  }
};

// Track response consistency
const trackResponseConsistency = (text) => {
  // Extract opinions and facts from the response
  const opinionPatterns = [
    /I (?:think|believe|feel|consider) that (.*?)(?:\.|$)/i,
    /In my (?:opinion|view|assessment) (.*?)(?:\.|$)/i,
    /I would (?:recommend|suggest|advise) (.*?)(?:\.|$)/i
  ];

  const factPatterns = [
    /(?:is|are|was|were) (.*?)(?:\.|$)/i,
    /(?:has|have|had) (.*?)(?:\.|$)/i,
    /(?:consists of|contains|includes) (.*?)(?:\.|$)/i
  ];

  // Track opinions
  for (const pattern of opinionPatterns) {
    const matches = [...text.matchAll(new RegExp(pattern, 'gi'))];
    for (const match of matches) {
      if (match && match[1]) {
        const opinion = match[0].trim();
        // Store in context
        const opinions = getContextFromConversation('statedOpinions') || '';
        const opinionsArray = opinions ? opinions.split('|') : [];
        if (!opinionsArray.includes(opinion)) {
          opinionsArray.push(opinion);
          // Keep only the last 10 opinions
          if (opinionsArray.length > 10) {
            opinionsArray.shift();
          }
          addContextToConversation('statedOpinions', opinionsArray.join('|'));
        }
      }
    }
  }

  // Track facts
  for (const pattern of factPatterns) {
    const matches = [...text.matchAll(new RegExp(pattern, 'gi'))];
    for (const match of matches) {
      if (match && match[1] && match[1].length > 10) { // Only track substantial facts
        const fact = match[0].trim();
        // Store in context
        const facts = getContextFromConversation('statedFacts') || '';
        const factsArray = facts ? facts.split('|') : [];
        if (!factsArray.includes(fact)) {
          factsArray.push(fact);
          // Keep only the last 15 facts
          if (factsArray.length > 15) {
            factsArray.shift();
          }
          addContextToConversation('statedFacts', factsArray.join('|'));
        }
      }
    }
  }
};

// Get conversation history for the current conversation
const getConversationHistory = (limit = 10) => {
  const conversation = getCurrentConversation();
  // Return the most recent messages up to the limit
  return conversation.messages.slice(-limit);
};

// Add a memory
const addMemory = (text, type = MEMORY_TYPES.LEARNED_FACT, metadata = {}) => {
  const memory = {
    id: uuidv4(),
    text,
    type,
    createdAt: new Date().toISOString(),
    lastAccessed: new Date().toISOString(),
    accessCount: 0,
    metadata,
    conversationId: memoryStore.currentConversationId
  };

  memoryStore.memories.push(memory);
  saveMemoryToStorage();
  return memory;
};

// Get all memories
const getAllMemories = () => {
  return [...memoryStore.memories].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );
};

// Get memories by type
const getMemoriesByType = (type) => {
  return memoryStore.memories.filter(memory => memory.type === type);
};

// Search memories
const searchMemories = (query) => {
  const lowerQuery = query.toLowerCase();
  return memoryStore.memories.filter(memory =>
    memory.text.toLowerCase().includes(lowerQuery) ||
    (memory.metadata.keywords &&
     memory.metadata.keywords.some(keyword =>
       keyword.toLowerCase().includes(lowerQuery)
     ))
  );
};

// Update memory access stats
const accessMemory = (memoryId) => {
  const memory = memoryStore.memories.find(m => m.id === memoryId);
  if (memory) {
    memory.lastAccessed = new Date().toISOString();
    memory.accessCount += 1;
    saveMemoryToStorage();
  }
  return memory;
};

// Delete a memory
const deleteMemory = (memoryId) => {
  const initialLength = memoryStore.memories.length;
  memoryStore.memories = memoryStore.memories.filter(m => m.id !== memoryId);
  const wasDeleted = initialLength > memoryStore.memories.length;
  if (wasDeleted) {
    saveMemoryToStorage();
  }
  return wasDeleted;
};

// Add context to current conversation
const addContextToConversation = (key, value) => {
  const conversation = getCurrentConversation();
  conversation.context[key] = value;
  conversation.updatedAt = new Date().toISOString();
  saveMemoryToStorage();
};

// Get context from current conversation
const getContextFromConversation = (key) => {
  const conversation = getCurrentConversation();
  return conversation.context[key];
};

// Get all context from current conversation
const getAllContextFromConversation = () => {
  const conversation = getCurrentConversation();
  return { ...conversation.context };
};

// Update conversation summary
const updateConversationSummary = (summary) => {
  const conversation = getCurrentConversation();
  conversation.summary = summary;
  conversation.updatedAt = new Date().toISOString();
  saveMemoryToStorage();
};

// Analyze message for important information to remember
const analyzeMessageForMemories = (text) => {
  // Enhanced pattern matching for important information
  // In a production system, this would use NLP/ML for better extraction

  // Personal identity information patterns
  const identityPatterns = [
    { pattern: /my name is (.*?)(?:\.|$)/i, type: MEMORY_TYPES.IMPORTANT, label: 'name' },
    { pattern: /i am (\d+) years old/i, type: MEMORY_TYPES.IMPORTANT, label: 'age' },
    { pattern: /my birthday is (.*?)(?:\.|$)/i, type: MEMORY_TYPES.IMPORTANT, label: 'birthday' },
    { pattern: /i live in (.*?)(?:\.|$)/i, type: MEMORY_TYPES.IMPORTANT, label: 'location' },
    { pattern: /i work (?:at|for|as) (.*?)(?:\.|$)/i, type: MEMORY_TYPES.IMPORTANT, label: 'occupation' },
    { pattern: /my email is (.*?)(?:\.|$)/i, type: MEMORY_TYPES.IMPORTANT, label: 'email' },
    { pattern: /my phone (?:number|is) (.*?)(?:\.|$)/i, type: MEMORY_TYPES.IMPORTANT, label: 'phone' }
  ];

  // Preference patterns
  const preferencePatterns = [
    { pattern: /i (?:like|love|enjoy|prefer) (.*?)(?:\.|$)/i, type: MEMORY_TYPES.USER_PREFERENCE, label: 'likes' },
    { pattern: /i (?:dislike|hate|don't like) (.*?)(?:\.|$)/i, type: MEMORY_TYPES.USER_PREFERENCE, label: 'dislikes' },
    { pattern: /my favorite (.*?) is (.*?)(?:\.|$)/i, type: MEMORY_TYPES.USER_PREFERENCE, label: 'favorite' },
    { pattern: /i am allergic to (.*?)(?:\.|$)/i, type: MEMORY_TYPES.USER_PREFERENCE, label: 'allergy' }
  ];

  // Explicit memory request patterns
  const explicitMemoryPatterns = [
    { pattern: /remember that (.*?)(?:\.|$)/i, type: MEMORY_TYPES.LEARNED_FACT, label: 'explicit' },
    { pattern: /don't forget (.*?)(?:\.|$)/i, type: MEMORY_TYPES.LEARNED_FACT, label: 'explicit' },
    { pattern: /note that (.*?)(?:\.|$)/i, type: MEMORY_TYPES.LEARNED_FACT, label: 'explicit' },
    { pattern: /keep in mind that (.*?)(?:\.|$)/i, type: MEMORY_TYPES.LEARNED_FACT, label: 'explicit' }
  ];

  // Combine all patterns
  const allPatterns = [...identityPatterns, ...preferencePatterns, ...explicitMemoryPatterns];

  // Check each pattern
  for (const { pattern, type, label } of allPatterns) {
    const match = text.match(pattern);
    if (match) {
      const memoryText = match[0];
      const extractedValue = match[1] || match[0];
      const keywords = extractKeywords(memoryText);

      // For name specifically, store it in a special way
      if (label === 'name') {
        const name = extractedValue.trim();
        // Store the name in context for the current conversation
        addContextToConversation('userName', name);
      }

      // Add the memory with enhanced metadata
      addMemory(memoryText, type, {
        keywords,
        extractedFrom: text,
        pattern: pattern.toString(),
        label,
        value: extractedValue.trim(),
        importance: type === MEMORY_TYPES.IMPORTANT ? 'high' : 'medium'
      });
    }
  }

  // Look for implicit facts that might be important
  const implicitFactPatterns = [
    /i (?:am|have been) (.*?)(?:\.|$)/i,
    /i (?:have|own) (.*?)(?:\.|$)/i,
    /i (?:went to|graduated from) (.*?)(?:\.|$)/i,
    /i (?:speak|understand) (.*?)(?:\.|$)/i
  ];

  for (const pattern of implicitFactPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const memoryText = match[0];
      const keywords = extractKeywords(memoryText);

      // Add as a lower priority memory
      addMemory(memoryText, MEMORY_TYPES.LEARNED_FACT, {
        keywords,
        extractedFrom: text,
        pattern: pattern.toString(),
        importance: 'low'
      });
    }
  }
};

// Extract keywords from text
const extractKeywords = (text) => {
  // Simple keyword extraction
  // In a production system, this would use NLP for better extraction
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['that', 'this', 'with', 'from', 'have', 'what', 'when', 'where', 'which', 'there', 'their', 'about'].includes(word));

  return [...new Set(words)]; // Remove duplicates
};

// Get relevant memories for a given query
const getRelevantMemories = (query, limit = 5, memoryType = null) => {
  // Simple relevance scoring
  // In a production system, this would use embeddings and semantic search
  const queryKeywords = extractKeywords(query);

  if (queryKeywords.length === 0) {
    return [];
  }

  // Filter memories by type if specified
  const filteredMemories = memoryType
    ? memoryStore.memories.filter(memory => memory.type === memoryType)
    : memoryStore.memories;

  // Score each memory based on keyword overlap and other factors
  const scoredMemories = filteredMemories.map(memory => {
    const memoryKeywords = memory.metadata?.keywords || extractKeywords(memory.text);

    // Count matching keywords
    const matchingKeywords = queryKeywords.filter(keyword =>
      memoryKeywords.some(mk => mk.includes(keyword) || keyword.includes(mk))
    );

    // Base score from keyword matching
    let score = matchingKeywords.length / queryKeywords.length;

    // Boost score based on importance
    if (memory.metadata?.importance === 'high') {
      score *= 1.5;
    } else if (memory.metadata?.importance === 'medium') {
      score *= 1.2;
    }

    // Boost score for more frequently accessed memories
    if (memory.accessCount > 3) {
      score *= 1.3;
    } else if (memory.accessCount > 0) {
      score *= 1.1;
    }

    // Boost score for more recent memories
    const ageInDays = (new Date() - new Date(memory.createdAt)) / (1000 * 60 * 60 * 24);
    if (ageInDays < 1) {
      score *= 1.2; // Boost very recent memories (less than a day old)
    }

    return {
      memory,
      score
    };
  });

  // Sort by score and return top results
  return scoredMemories
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.memory);
};

// Generate a system message with relevant context and memories
const generateContextualSystemMessage = (userMessage) => {
  // Check if this is a personal question that can be answered from memory
  const personalQuestions = [
    { pattern: /my name/i, contextKey: 'userName', fallbackMemoryLabel: 'name' },
    { pattern: /my (birthday|birth date)/i, contextKey: 'userBirthday', fallbackMemoryLabel: 'birthday' },
    { pattern: /my (address|location|city|country)/i, contextKey: 'userLocation', fallbackMemoryLabel: 'location' },
    { pattern: /my (job|work|profession|occupation)/i, contextKey: 'userOccupation', fallbackMemoryLabel: 'occupation' },
    { pattern: /my (hobby|hobbies|interests)/i, contextKey: 'userHobbies', fallbackMemoryLabel: 'likes' },
    { pattern: /my (email|phone|contact)/i, contextKey: 'userContact', fallbackMemoryLabel: 'email' },
    { pattern: /my (preference|favorite)/i, contextKey: null, fallbackMemoryLabel: 'favorite' },
    { pattern: /do i like/i, contextKey: null, fallbackMemoryLabel: 'likes' },
    { pattern: /what did i tell you about/i, contextKey: null, fallbackMemoryLabel: null }
  ];

  // Get conversation context
  const context = getAllContextFromConversation();

  // Check if this is a personal question
  const isPersonalQuestion = personalQuestions.some(q => q.pattern.test(userMessage));

  // Get relevant memories - prioritize important ones for personal questions
  let relevantMemories = [];
  if (isPersonalQuestion) {
    // First try to get memories of type IMPORTANT
    relevantMemories = getRelevantMemories(userMessage, 3, MEMORY_TYPES.IMPORTANT);

    // If no important memories found, try USER_PREFERENCE
    if (relevantMemories.length === 0) {
      relevantMemories = getRelevantMemories(userMessage, 3, MEMORY_TYPES.USER_PREFERENCE);
    }

    // If still no memories found, try all types
    if (relevantMemories.length === 0) {
      relevantMemories = getRelevantMemories(userMessage);
    }

    // For specific personal questions, try to find the exact memory by label
    const matchingQuestion = personalQuestions.find(q => q.pattern.test(userMessage));
    if (matchingQuestion && matchingQuestion.fallbackMemoryLabel) {
      const labelMemories = memoryStore.memories.filter(m =>
        m.metadata && m.metadata.label === matchingQuestion.fallbackMemoryLabel
      );

      if (labelMemories.length > 0) {
        // Add these memories to the relevant ones if not already included
        labelMemories.forEach(memory => {
          if (!relevantMemories.some(m => m.id === memory.id)) {
            relevantMemories.push(memory);
          }
        });
      }
    }
  } else {
    // For non-personal questions, just get generally relevant memories
    relevantMemories = getRelevantMemories(userMessage);
  }

  // Build contextual system message
  let contextualMessage = '';

  // Add user name if available (highest priority context)
  if (context.userName) {
    contextualMessage += `The user's name is ${context.userName}.\n\n`;
  }

  // Add relevant memories
  if (relevantMemories.length > 0) {
    contextualMessage += "Here are some relevant things I know about the user:\n";
    relevantMemories.forEach(memory => {
      contextualMessage += `- ${memory.text}\n`;
      // Update access stats
      accessMemory(memory.id);
    });
    contextualMessage += "\n";
  }

  // Add consistency information
  const statedOpinions = context.statedOpinions;
  const statedFacts = context.statedFacts;

  if (statedOpinions || statedFacts) {
    contextualMessage += "For consistency, here are opinions and facts I've previously stated:\n";

    if (statedOpinions) {
      const opinions = statedOpinions.split('|');
      if (opinions.length > 0) {
        contextualMessage += "Opinions:\n";
        opinions.forEach(opinion => {
          contextualMessage += `- ${opinion}\n`;
        });
      }
    }

    if (statedFacts) {
      const facts = statedFacts.split('|');
      if (facts.length > 0) {
        contextualMessage += "Facts:\n";
        facts.forEach(fact => {
          contextualMessage += `- ${fact}\n`;
        });
      }
    }

    contextualMessage += "\n";
  }

  // Add conversation topic information
  if (context.currentTopic) {
    contextualMessage += `Current topic of conversation: ${context.currentTopic}\n`;
  }

  if (context.previousTopics) {
    const topics = context.previousTopics.split(',');
    if (topics.length > 0) {
      contextualMessage += "Previous topics we've discussed:\n";
      topics.forEach(topic => {
        contextualMessage += `- ${topic}\n`;
      });
      contextualMessage += "\n";
    }
  }

  // Add user sentiment if available
  if (context.userSentiment) {
    contextualMessage += `User's current sentiment appears to be: ${context.userSentiment}\n\n`;
  }

  // Add other context items
  const excludedKeys = ['userName', 'statedOpinions', 'statedFacts', 'currentTopic', 'previousTopics', 'userSentiment'];
  const otherContextEntries = Object.entries(context).filter(([key]) => !excludedKeys.includes(key));

  if (otherContextEntries.length > 0) {
    contextualMessage += "Additional conversation context:\n";
    for (const [key, value] of otherContextEntries) {
      contextualMessage += `- ${key}: ${value}\n`;
    }
    contextualMessage += "\n";
  }

  return contextualMessage;
};

// Initialize memory on module load
initializeMemory();

export {
  initializeMemory,
  resetMemory,
  createNewConversation,
  switchConversation,
  getCurrentConversation,
  getAllConversations,
  addMessageToConversation,
  getConversationHistory,
  addMemory,
  getAllMemories,
  getMemoriesByType,
  searchMemories,
  accessMemory,
  deleteMemory,
  addContextToConversation,
  getContextFromConversation,
  getAllContextFromConversation,
  updateConversationSummary,
  generateContextualSystemMessage,
  MEMORY_TYPES
};
