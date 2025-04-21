import express from 'express';
import { body } from 'express-validator';
import { 
  generateChatResponse,
  processImage,
  generateDocumentContent
} from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Generate chat response
router.post(
  '/chat',
  protect,
  [
    body('messages').isArray().withMessage('Messages must be an array'),
    body('messages.*.content').notEmpty().withMessage('Message content is required'),
    body('messages.*.sender').isIn(['user', 'assistant']).withMessage('Sender must be either "user" or "assistant"'),
    body('conversationId').optional().isUUID().withMessage('Invalid conversation ID'),
    validate
  ],
  generateChatResponse
);

// Process image
router.post(
  '/image',
  protect,
  [
    body('imageUrl').notEmpty().withMessage('Image URL is required'),
    body('prompt').optional(),
    validate
  ],
  processImage
);

// Generate document content
router.post(
  '/document',
  protect,
  [
    body('prompt').notEmpty().withMessage('Prompt is required'),
    body('title').optional(),
    body('existingContent').optional(),
    validate
  ],
  generateDocumentContent
);

export default router;
