import { prisma } from '../server.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get user statistics
 * @route GET /api/users/stats
 * @access Private
 */
export const getUserStats = asyncHandler(async (req, res) => {
  // Get counts of user's data
  const documentCount = await prisma.document.count({
    where: {
      userId: req.user.id,
      isDeleted: false
    }
  });
  
  const conversationCount = await prisma.conversation.count({
    where: {
      userId: req.user.id,
      isDeleted: false
    }
  });
  
  const messageCount = await prisma.message.count({
    where: {
      conversation: {
        userId: req.user.id
      }
    }
  });
  
  const memoryCount = await prisma.memory.count({
    where: {
      userId: req.user.id
    }
  });
  
  const sharedDocumentCount = await prisma.sharedDocument.count({
    where: {
      sharedById: req.user.id
    }
  });
  
  // Get recent activity
  const recentDocuments = await prisma.document.findMany({
    where: {
      userId: req.user.id,
      isDeleted: false
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5,
    select: {
      id: true,
      title: true,
      updatedAt: true
    }
  });
  
  const recentConversations = await prisma.conversation.findMany({
    where: {
      userId: req.user.id,
      isDeleted: false
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5,
    select: {
      id: true,
      title: true,
      updatedAt: true
    }
  });
  
  res.json({
    counts: {
      documents: documentCount,
      conversations: conversationCount,
      messages: messageCount,
      memories: memoryCount,
      sharedDocuments: sharedDocumentCount
    },
    recent: {
      documents: recentDocuments,
      conversations: recentConversations
    }
  });
});

/**
 * Update user preferences
 * @route PUT /api/users/preferences
 * @access Private
 */
export const updatePreferences = asyncHandler(async (req, res) => {
  const { preferences } = req.body;
  
  if (!preferences) {
    res.status(400);
    throw new Error('Preferences are required');
  }
  
  // Update user preferences
  const updatedUser = await prisma.user.update({
    where: {
      id: req.user.id
    },
    data: {
      preferences
    },
    select: {
      id: true,
      preferences: true
    }
  });
  
  res.json(updatedUser);
});
