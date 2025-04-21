import { prisma } from '../server.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get all conversations for the authenticated user
 * @route GET /api/conversations
 * @access Private
 */
export const getConversations = asyncHandler(async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      userId: req.user.id,
      isDeleted: false
    },
    orderBy: {
      updatedAt: 'desc'
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          messages: true,
          memories: true
        }
      },
      messages: {
        take: 1,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          content: true,
          createdAt: true
        }
      }
    }
  });
  
  res.json(conversations);
});

/**
 * Get a single conversation by ID with messages
 * @route GET /api/conversations/:id
 * @access Private
 */
export const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: req.params.id
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'asc'
        }
      },
      memories: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });
  
  // Check if conversation exists and belongs to user
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  
  if (conversation.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this conversation');
  }
  
  res.json(conversation);
});

/**
 * Create a new conversation
 * @route POST /api/conversations
 * @access Private
 */
export const createConversation = asyncHandler(async (req, res) => {
  const { title } = req.body;
  
  const conversation = await prisma.conversation.create({
    data: {
      title: title || 'New Conversation',
      userId: req.user.id
    }
  });
  
  res.status(201).json(conversation);
});

/**
 * Update a conversation
 * @route PUT /api/conversations/:id
 * @access Private
 */
export const updateConversation = asyncHandler(async (req, res) => {
  const { title } = req.body;
  
  // Check if conversation exists
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: req.params.id
    }
  });
  
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  
  // Check if user owns the conversation
  if (conversation.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this conversation');
  }
  
  // Update conversation
  const updatedConversation = await prisma.conversation.update({
    where: {
      id: req.params.id
    },
    data: {
      title,
      updatedAt: new Date()
    }
  });
  
  res.json(updatedConversation);
});

/**
 * Delete a conversation (soft delete)
 * @route DELETE /api/conversations/:id
 * @access Private
 */
export const deleteConversation = asyncHandler(async (req, res) => {
  // Check if conversation exists
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: req.params.id
    }
  });
  
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  
  // Check if user owns the conversation
  if (conversation.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this conversation');
  }
  
  // Soft delete conversation
  await prisma.conversation.update({
    where: {
      id: req.params.id
    },
    data: {
      isDeleted: true
    }
  });
  
  res.json({ message: 'Conversation removed' });
});

/**
 * Add a message to a conversation
 * @route POST /api/conversations/:id/messages
 * @access Private
 */
export const addMessage = asyncHandler(async (req, res) => {
  const { content, sender } = req.body;
  
  // Check if conversation exists
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: req.params.id
    }
  });
  
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  
  // Check if user owns the conversation
  if (conversation.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to add messages to this conversation');
  }
  
  // Create message
  const message = await prisma.message.create({
    data: {
      content,
      sender,
      conversationId: req.params.id
    }
  });
  
  // Update conversation's updatedAt
  await prisma.conversation.update({
    where: {
      id: req.params.id
    },
    data: {
      updatedAt: new Date()
    }
  });
  
  res.status(201).json(message);
});

/**
 * Get messages for a conversation
 * @route GET /api/conversations/:id/messages
 * @access Private
 */
export const getMessages = asyncHandler(async (req, res) => {
  // Check if conversation exists
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: req.params.id
    }
  });
  
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  
  // Check if user owns the conversation
  if (conversation.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to view messages in this conversation');
  }
  
  // Get messages
  const messages = await prisma.message.findMany({
    where: {
      conversationId: req.params.id
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
  
  res.json(messages);
});
