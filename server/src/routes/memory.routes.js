import express from 'express';
import { body, param } from 'express-validator';
import { 
  getMemories, 
  getMemoryById, 
  createMemory, 
  updateMemory, 
  deleteMemory,
  getMemoriesByConversation
} from '../controllers/memory.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Get all memories
router.get('/', protect, getMemories);

// Get a single memory
router.get(
  '/:id',
  protect,
  [
    param('id').isUUID().withMessage('Invalid memory ID'),
    validate
  ],
  getMemoryById
);

// Create a memory
router.post(
  '/',
  protect,
  [
    body('content').notEmpty().withMessage('Content is required'),
    body('importance').optional().isInt({ min: 1, max: 5 }).withMessage('Importance must be between 1 and 5'),
    body('conversationId').optional().isUUID().withMessage('Invalid conversation ID'),
    validate
  ],
  createMemory
);

// Update a memory
router.put(
  '/:id',
  protect,
  [
    param('id').isUUID().withMessage('Invalid memory ID'),
    body('content').optional().notEmpty().withMessage('Content cannot be empty'),
    body('importance').optional().isInt({ min: 1, max: 5 }).withMessage('Importance must be between 1 and 5'),
    validate
  ],
  updateMemory
);

// Delete a memory
router.delete(
  '/:id',
  protect,
  [
    param('id').isUUID().withMessage('Invalid memory ID'),
    validate
  ],
  deleteMemory
);

// Get memories for a conversation
router.get(
  '/conversation/:conversationId',
  protect,
  [
    param('conversationId').isUUID().withMessage('Invalid conversation ID'),
    validate
  ],
  getMemoriesByConversation
);

export default router;
