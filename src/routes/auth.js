const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { logManualAuditEvent } = require('../middleware/audit');
const crypto = require('crypto');

const router = express.Router();

// Helper function to generate confirmation code
const generateConfirmationCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6-character code
};

// Helper function to call Power Automate workflow
const sendConfirmationEmail = async (email, confirmationCode) => {
  const powerAutomateUrl = 'https://prod-48.westeurope.logic.azure.com:443/workflows/01cd22d16e4b4aecb409974a9bbe38ba/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=lr1STBgg1iHIuA6IJEP5XUzyfqyuu5BWNjZu_Yz7K9E';
  
  try {
    const response = await fetch(powerAutomateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        special: confirmationCode
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Power Automate response error:', response.status, errorText);
      throw new Error(`Failed to send confirmation email: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error calling Power Automate:', error);
    throw error;
  }
};

// Login - Step 1: Validate credentials and send confirmation email
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { username, password } = req.body;
  const db = getDatabase();

  // Find user
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    throw createError(401, 'Invalid credentials');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw createError(401, 'Invalid credentials');
  }

  // Generate confirmation code
  const confirmationCode = generateConfirmationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store confirmation in database
  await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO email_confirmations (user_id, email, confirmation_code, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.email, confirmationCode, expiresAt.toISOString(), req.ip, req.get('User-Agent')],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  // Send confirmation email via Power Automate
  try {
    await sendConfirmationEmail(user.email, confirmationCode);
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    // Still return success to user, but log the error
  }

  // Log login attempt
  logManualAuditEvent(
    user.id, 
    'LOGIN_ATTEMPT', 
    'AUTH', 
    user.id.toString(), 
    { username: user.username, email: user.email },
    req.ip,
    req.get('User-Agent')
  );

  res.json({
    message: 'Confirmation email sent',
    requiresConfirmation: true,
    userId: user.id,
    email: user.email
  });
}));

// Login - Step 2: Verify confirmation code and complete login
router.post('/confirm-email', [
  body('userId').isInt().withMessage('Valid user ID is required'),
  body('confirmationCode').trim().notEmpty().withMessage('Confirmation code is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { userId, confirmationCode } = req.body;
  const db = getDatabase();

  // Find valid confirmation
  const confirmation = await new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM email_confirmations WHERE user_id = ? AND confirmation_code = ? AND used_at IS NULL AND expires_at > datetime("now") ORDER BY created_at DESC LIMIT 1',
      [userId, confirmationCode.toUpperCase()],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!confirmation) {
    throw createError(401, 'Invalid or expired confirmation code');
  }

  // Get user details
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    throw createError(404, 'User not found');
  }

  // Mark confirmation as used
  await new Promise((resolve, reject) => {
    db.run(
      'UPDATE email_confirmations SET used_at = datetime("now") WHERE id = ?',
      [confirmation.id],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  // Generate token
  const token = generateToken(user);

  // Log successful login
  logManualAuditEvent(
    user.id, 
    'LOGIN_SUCCESS', 
    'AUTH', 
    user.id.toString(), 
    { username: user.username, confirmationId: confirmation.id },
    req.ip,
    req.get('User-Agent')
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  });
}));

// Resend confirmation email
router.post('/resend-confirmation', [
  body('userId').isInt().withMessage('Valid user ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { userId } = req.body;
  const db = getDatabase();

  // Get user details
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    throw createError(404, 'User not found');
  }

  // Check if there's already a recent confirmation request (prevent spam)
  const recentConfirmation = await new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM email_confirmations WHERE user_id = ? AND created_at > datetime("now", "-2 minutes") ORDER BY created_at DESC LIMIT 1',
      [userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (recentConfirmation) {
    throw createError(429, 'Please wait before requesting another confirmation email');
  }

  // Generate new confirmation code
  const confirmationCode = generateConfirmationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store new confirmation in database
  await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO email_confirmations (user_id, email, confirmation_code, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, user.email, confirmationCode, expiresAt.toISOString(), req.ip, req.get('User-Agent')],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  // Send confirmation email via Power Automate
  try {
    await sendConfirmationEmail(user.email, confirmationCode);
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    throw createError(500, 'Failed to send confirmation email');
  }

  res.json({
    message: 'Confirmation email sent successfully'
  });
}));

// Register (only admin can create new users based on project plan)
router.post('/register', authenticateToken, [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
  // Only admin can create new users
  if (req.user.role !== 'admin') {
    throw createError(403, 'Only administrators can create new users');
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { username, email, password, role = 'user' } = req.body;
  const db = getDatabase();

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const result = await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, role],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  // Get created user
  const newUser = await new Promise((resolve, reject) => {
    db.get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [result.lastID], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  res.status(201).json({
    message: 'User created successfully',
    user: newUser
  });
}));

// Get current user profile
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const db = getDatabase();
  
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?', [req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    throw createError(404, 'User not found');
  }

  res.json(user);
}));

// Update user profile
router.put('/me', authenticateToken, [
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('currentPassword').optional().notEmpty().withMessage('Current password is required when changing password'),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { username, email, currentPassword, newPassword } = req.body;
  const db = getDatabase();

  // Get current user
  const currentUser = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!currentUser) {
    throw createError(404, 'User not found');
  }

  // If changing password, verify current password
  if (newPassword) {
    if (!currentPassword) {
      throw createError(400, 'Current password is required to change password');
    }

    const isValidCurrentPassword = await bcrypt.compare(currentPassword, currentUser.password_hash);
    if (!isValidCurrentPassword) {
      throw createError(400, 'Current password is incorrect');
    }
  }

  // Prepare update data
  const updateData = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;
  if (newPassword) updateData.password_hash = await bcrypt.hash(newPassword, 10);
  
  updateData.updated_at = new Date().toISOString();

  // Build update query
  const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
  const updateValues = Object.values(updateData);
  updateValues.push(req.user.id);

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET ${updateFields} WHERE id = ?`,
      updateValues,
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  // Get updated user
  const updatedUser = await new Promise((resolve, reject) => {
    db.get('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?', [req.user.id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  res.json({
    message: 'Profile updated successfully',
    user: updatedUser
  });
}));

// Logout (client-side token removal, log the event)
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // Log logout event
  logManualAuditEvent(
    req.user.id, 
    'LOGOUT', 
    'AUTH', 
    req.user.id.toString(), 
    { username: req.user.username },
    req.ip,
    req.get('User-Agent')
  );

  res.json({ message: 'Logged out successfully' });
}));

module.exports = router; 