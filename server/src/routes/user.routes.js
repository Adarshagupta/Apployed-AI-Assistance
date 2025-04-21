import express from 'express';
import { body } from 'express-validator';
import { 
  getUserStats,
  updatePreferences
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Get user statistics
router.get('/stats', protect, getUserStats);

// Update user preferences
router.put(
  '/preferences',
  protect,
  [
    body('preferences').isObject().withMessage('Preferences must be an object'),
    validate
  ],
  updatePreferences
);

export default router;
