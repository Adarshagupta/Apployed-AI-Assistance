import jwt from 'jsonwebtoken';
import { prisma } from '../server.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const protect = async (req, res, next) => {
  let token;
  
  // Check if token exists in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by id and attach to request (excluding password)
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          isActive: true,
          lastLogin: true,
          profilePicture: true,
          preferences: true
        }
      });
      
      if (!user) {
        res.status(401);
        throw new Error('User not found');
      }
      
      if (!user.isActive) {
        res.status(401);
        throw new Error('User account is deactivated');
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth error:', error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }
  
  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
};
