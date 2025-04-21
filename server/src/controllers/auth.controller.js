import bcrypt from 'bcrypt';
import { prisma } from '../server.js';
import { generateToken } from '../utils/generateToken.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  
  // Check if user already exists
  const userExists = await prisma.user.findUnique({
    where: { email }
  });
  
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    }
  });
  
  if (user) {
    // Generate token
    const token = generateToken(user.id);
    
    res.status(201).json({
      ...user,
      token
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * Authenticate user & get token
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  // Check if user exists and password matches
  if (user && (await bcrypt.compare(password, user.password))) {
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      token: generateToken(user.id)
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

/**
 * Get user profile
 * @route GET /api/auth/profile
 * @access Private
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      profilePicture: true,
      createdAt: true,
      lastLogin: true,
      preferences: true,
      _count: {
        select: {
          documents: true,
          conversations: true,
          memories: true
        }
      }
    }
  });
  
  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, password, profilePicture, preferences } = req.body;
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Prepare update data
  const updateData = {};
  
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (profilePicture) updateData.profilePicture = profilePicture;
  if (preferences) updateData.preferences = preferences;
  
  // Hash password if provided
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }
  
  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      profilePicture: true,
      preferences: true,
      updatedAt: true
    }
  });
  
  res.json({
    ...updatedUser,
    token: generateToken(updatedUser.id)
  });
});
