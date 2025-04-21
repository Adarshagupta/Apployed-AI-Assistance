import express from 'express';
import { body, param } from 'express-validator';
import { 
  getConversations, 
  getConversationById, 
  createConversation, 
  updateConversation, 
  deleteConversation,
  addMessage,
  getMessages
} from '../controllers/conversation.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Get all conversations
router.get('/', protect, getConversations);

// Get a single conversation
router.get(
  '/:id',
  protect,
  [
    param('id').isUUID().withMessage('Invalid conversation ID'),
    validate
  ],
  getConversationById
);

// Create a conversation
router.post(
  '/',
  protect,
  [
    body('title').optional(),
    validate
  ],
  createConversation
);

// Update a conversation
router.put(
  '/:id',
  protect,
  [
    param('id').isUUID().withMessage('Invalid conversation ID'),
    body('title').notEmpty().withMessage('Title is required'),
    validate
  ],
  updateConversation
);

// Delete a conversation
router.delete(
  '/:id',
  protect,
  [
    param('id').isUUID().withMessage('Invalid conversation ID'),
    validate
  ],
  deleteConversation
);

// Add a message to a conversation
router.post(
  '/:id/messages',
  protect,
  [
    param('id').isUUID().withMessage('Invalid conversation ID'),
    body('content').notEmpty().withMessage('Content is required'),
    body('sender').isIn(['user', 'assistant']).withMessage('Sender must be either "user" or "assistant"'),
    validate
  ],
  addMessage
);

// Get messages for a conversation
router.get(
  '/:id/messages',
  protect,
  [
    param('id').isUUID().withMessage('Invalid conversation ID'),
    validate
  ],
  getMessages
);

export default router;
