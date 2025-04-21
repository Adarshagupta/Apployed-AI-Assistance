import { prisma } from '../server.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get all memories for the authenticated user
 * @route GET /api/memories
 * @access Private
 */
export const getMemories = asyncHandler(async (req, res) => {
  const memories = await prisma.memory.findMany({
    where: {
      userId: req.user.id
    },
    orderBy: {
      importance: 'desc'
    }
  });
  
  res.json(memories);
});

/**
 * Get a single memory by ID
 * @route GET /api/memories/:id
 * @access Private
 */
export const getMemoryById = asyncHandler(async (req, res) => {
  const memory = await prisma.memory.findUnique({
    where: {
      id: req.params.id
    },
    include: {
      conversation: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });
  
  // Check if memory exists and belongs to user
  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }
  
  if (memory.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this memory');
  }
  
  // Update access count and last accessed
  await prisma.memory.update({
    where: {
      id: req.params.id
    },
    data: {
      accessCount: {
        increment: 1
      },
      lastAccessed: new Date()
    }
  });
  
  res.json(memory);
});

/**
 * Create a new memory
 * @route POST /api/memories
 * @access Private
 */
export const createMemory = asyncHandler(async (req, res) => {
  const { content, importance, conversationId } = req.body;
  
  // If conversationId is provided, check if it exists and belongs to user
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
      throw new Error('Not authorized to add memories to this conversation');
    }
  }
  
  // Create memory
  const memory = await prisma.memory.create({
    data: {
      content,
      importance: importance || 1,
      userId: req.user.id,
      conversationId
    }
  });
  
  res.status(201).json(memory);
});

/**
 * Update a memory
 * @route PUT /api/memories/:id
 * @access Private
 */
export const updateMemory = asyncHandler(async (req, res) => {
  const { content, importance } = req.body;
  
  // Check if memory exists
  const memory = await prisma.memory.findUnique({
    where: {
      id: req.params.id
    }
  });
  
  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }
  
  // Check if user owns the memory
  if (memory.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this memory');
  }
  
  // Update memory
  const updatedMemory = await prisma.memory.update({
    where: {
      id: req.params.id
    },
    data: {
      content,
      importance
    }
  });
  
  res.json(updatedMemory);
});

/**
 * Delete a memory
 * @route DELETE /api/memories/:id
 * @access Private
 */
export const deleteMemory = asyncHandler(async (req, res) => {
  // Check if memory exists
  const memory = await prisma.memory.findUnique({
    where: {
      id: req.params.id
    }
  });
  
  if (!memory) {
    res.status(404);
    throw new Error('Memory not found');
  }
  
  // Check if user owns the memory
  if (memory.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this memory');
  }
  
  // Delete memory
  await prisma.memory.delete({
    where: {
      id: req.params.id
    }
  });
  
  res.json({ message: 'Memory removed' });
});

/**
 * Get memories for a conversation
 * @route GET /api/memories/conversation/:conversationId
 * @access Private
 */
export const getMemoriesByConversation = asyncHandler(async (req, res) => {
  // Check if conversation exists
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: req.params.conversationId
    }
  });
  
  if (!conversation) {
    res.status(404);
    throw new Error('Conversation not found');
  }
  
  // Check if user owns the conversation
  if (conversation.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to view memories for this conversation');
  }
  
  // Get memories
  const memories = await prisma.memory.findMany({
    where: {
      conversationId: req.params.conversationId
    },
    orderBy: {
      importance: 'desc'
    }
  });
  
  res.json(memories);
});
