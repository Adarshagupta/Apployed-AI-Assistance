import { GoogleGenerativeAI } from '@google/generative-ai';
import { asyncHandler } from '../utils/asyncHandler.js';
import { prisma } from '../server.js';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Generate chat response
 * @route POST /api/ai/chat
 * @access Private
 */
export const generateChatResponse = asyncHandler(async (req, res) => {
  const { messages, conversationId, systemPrompt } = req.body;
  
  if (!messages || !messages.length) {
    res.status(400);
    throw new Error('Messages are required');
  }
  
  // Check if conversation exists and belongs to user if conversationId is provided
  if (conversationId) {
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId
      }
    });
    
    if (!conversation) {
      res.status(404);
      throw new Error('Conversation not found');
    }
    
    if (conversation.userId !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to access this conversation');
    }
  }
  
  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Format messages for the API
    const formattedMessages = messages.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
    
    // Add system prompt if provided
    if (systemPrompt) {
      formattedMessages.unshift({
        role: 'system',
        parts: [{ text: systemPrompt }]
      });
    }
    
    // Generate response
    const result = await model.generateContent({
      contents: formattedMessages,
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
    
    const responseText = result.response.text();
    
    // Save message to database if conversationId is provided
    if (conversationId) {
      // Save user message if it's not already in the database
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.sender === 'user' && !lastUserMessage.id) {
        await prisma.message.create({
          data: {
            content: lastUserMessage.content,
            sender: 'user',
            conversationId
          }
        });
      }
      
      // Save assistant response
      await prisma.message.create({
        data: {
          content: responseText,
          sender: 'assistant',
          conversationId
        }
      });
      
      // Update conversation's updatedAt
      await prisma.conversation.update({
        where: {
          id: conversationId
        },
        data: {
          updatedAt: new Date()
        }
      });
    }
    
    res.json({ response: responseText });
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500);
    throw new Error('Error generating AI response: ' + error.message);
  }
});

/**
 * Process image with AI
 * @route POST /api/ai/image
 * @access Private
 */
export const processImage = asyncHandler(async (req, res) => {
  const { imageUrl, prompt } = req.body;
  
  if (!imageUrl) {
    res.status(400);
    throw new Error('Image URL is required');
  }
  
  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });
    
    // Prepare the prompt
    const userPrompt = prompt || 'Describe this image in detail';
    
    // Generate response
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: userPrompt },
            { inlineData: { mimeType: 'image/jpeg', data: imageUrl.split(',')[1] } }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        topK: 64,
      }
    });
    
    const responseText = result.response.text();
    
    res.json({ response: responseText });
  } catch (error) {
    console.error('AI image processing error:', error);
    res.status(500);
    throw new Error('Error processing image: ' + error.message);
  }
});

/**
 * Generate document content
 * @route POST /api/ai/document
 * @access Private
 */
export const generateDocumentContent = asyncHandler(async (req, res) => {
  const { prompt, title, existingContent } = req.body;
  
  if (!prompt) {
    res.status(400);
    throw new Error('Prompt is required');
  }
  
  try {
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Prepare the prompt
    let fullPrompt = prompt;
    if (title) {
      fullPrompt = `Document Title: ${title}\n\n${fullPrompt}`;
    }
    if (existingContent) {
      fullPrompt = `${fullPrompt}\n\nExisting content to build upon:\n${existingContent}`;
    }
    
    // Generate response
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      }
    });
    
    const responseText = result.response.text();
    
    res.json({ response: responseText });
  } catch (error) {
    console.error('AI document generation error:', error);
    res.status(500);
    throw new Error('Error generating document content: ' + error.message);
  }
});
