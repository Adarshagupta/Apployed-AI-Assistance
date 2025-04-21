import express from 'express';
import { body, param } from 'express-validator';
import { 
  getDocuments, 
  getDocumentById, 
  createDocument, 
  updateDocument, 
  deleteDocument, 
  shareDocument,
  getSharedDocument
} from '../controllers/document.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// Get all documents
router.get('/', protect, getDocuments);

// Get a single document
router.get(
  '/:id',
  protect,
  [
    param('id').isUUID().withMessage('Invalid document ID'),
    validate
  ],
  getDocumentById
);

// Create a document
router.post(
  '/',
  protect,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    validate
  ],
  createDocument
);

// Update a document
router.put(
  '/:id',
  protect,
  [
    param('id').isUUID().withMessage('Invalid document ID'),
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    validate
  ],
  updateDocument
);

// Delete a document
router.delete(
  '/:id',
  protect,
  [
    param('id').isUUID().withMessage('Invalid document ID'),
    validate
  ],
  deleteDocument
);

// Share a document
router.post(
  '/:id/share',
  protect,
  [
    param('id').isUUID().withMessage('Invalid document ID'),
    body('permissions').isIn(['read', 'comment', 'edit']).withMessage('Invalid permissions'),
    body('email').optional().isEmail().withMessage('Invalid email'),
    body('expiresAt').optional().isISO8601().withMessage('Invalid date format'),
    validate
  ],
  shareDocument
);

// Get a shared document (public access)
router.get(
  '/shared/:shareId',
  [
    param('shareId').isUUID().withMessage('Invalid share ID'),
    validate
  ],
  getSharedDocument
);

export default router;
