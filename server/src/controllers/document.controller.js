import { prisma } from '../server.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Get all documents for the authenticated user
 * @route GET /api/documents
 * @access Private
 */
export const getDocuments = asyncHandler(async (req, res) => {
  const documents = await prisma.document.findMany({
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
          shares: true
        }
      }
    }
  });
  
  res.json(documents);
});

/**
 * Get a single document by ID
 * @route GET /api/documents/:id
 * @access Private
 */
export const getDocumentById = asyncHandler(async (req, res) => {
  const document = await prisma.document.findUnique({
    where: {
      id: req.params.id
    },
    include: {
      shares: {
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          permissions: true,
          accessCount: true,
          lastAccessed: true,
          sharedViaEmail: true,
          sharedWith: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });
  
  // Check if document exists and belongs to user
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  
  if (document.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this document');
  }
  
  res.json(document);
});

/**
 * Create a new document
 * @route POST /api/documents
 * @access Private
 */
export const createDocument = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  
  const document = await prisma.document.create({
    data: {
      title,
      content,
      userId: req.user.id
    }
  });
  
  res.status(201).json(document);
});

/**
 * Update a document
 * @route PUT /api/documents/:id
 * @access Private
 */
export const updateDocument = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  
  // Check if document exists
  const document = await prisma.document.findUnique({
    where: {
      id: req.params.id
    }
  });
  
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  
  // Check if user owns the document
  if (document.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this document');
  }
  
  // Update document
  const updatedDocument = await prisma.document.update({
    where: {
      id: req.params.id
    },
    data: {
      title,
      content,
      updatedAt: new Date()
    }
  });
  
  res.json(updatedDocument);
});

/**
 * Delete a document (soft delete)
 * @route DELETE /api/documents/:id
 * @access Private
 */
export const deleteDocument = asyncHandler(async (req, res) => {
  // Check if document exists
  const document = await prisma.document.findUnique({
    where: {
      id: req.params.id
    }
  });
  
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  
  // Check if user owns the document
  if (document.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this document');
  }
  
  // Soft delete document
  await prisma.document.update({
    where: {
      id: req.params.id
    },
    data: {
      isDeleted: true
    }
  });
  
  res.json({ message: 'Document removed' });
});

/**
 * Share a document
 * @route POST /api/documents/:id/share
 * @access Private
 */
export const shareDocument = asyncHandler(async (req, res) => {
  const { email, permissions, expiresAt } = req.body;
  
  // Check if document exists
  const document = await prisma.document.findUnique({
    where: {
      id: req.params.id
    }
  });
  
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }
  
  // Check if user owns the document
  if (document.userId !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to share this document');
  }
  
  // Check if user with email exists
  let sharedWithUser = null;
  if (email) {
    sharedWithUser = await prisma.user.findUnique({
      where: {
        email
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
  }
  
  // Create share record
  const sharedDocument = await prisma.sharedDocument.create({
    data: {
      documentId: req.params.id,
      sharedById: req.user.id,
      sharedWithId: sharedWithUser?.id || null,
      sharedViaEmail: !sharedWithUser ? email : null,
      permissions: permissions || 'read',
      expiresAt: expiresAt ? new Date(expiresAt) : null
    },
    include: {
      sharedWith: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  
  res.status(201).json(sharedDocument);
});

/**
 * Get a shared document by ID
 * @route GET /api/documents/shared/:shareId
 * @access Public
 */
export const getSharedDocument = asyncHandler(async (req, res) => {
  const sharedDocument = await prisma.sharedDocument.findUnique({
    where: {
      id: req.params.shareId
    },
    include: {
      document: true,
      sharedBy: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
  
  if (!sharedDocument) {
    res.status(404);
    throw new Error('Shared document not found');
  }
  
  // Check if share has expired
  if (sharedDocument.expiresAt && new Date(sharedDocument.expiresAt) < new Date()) {
    res.status(403);
    throw new Error('This shared document has expired');
  }
  
  // Update access count and last accessed
  await prisma.sharedDocument.update({
    where: {
      id: req.params.shareId
    },
    data: {
      accessCount: {
        increment: 1
      },
      lastAccessed: new Date()
    }
  });
  
  res.json(sharedDocument);
});
