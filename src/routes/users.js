const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult, param, query } = require('express-validator');
const { getDatabase } = require('../database/init');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

// Get users list (admin only)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { page = 1, limit = 10, role } = req.query;
  const offset = (page - 1) * limit;
  const db = getDatabase();

  let baseQuery = `
    SELECT id, username, email, role, created_at, updated_at
    FROM users
  `;
  
  const params = [];
  const conditions = [];

  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }

  if (conditions.length > 0) {
    baseQuery += ` WHERE ${conditions.join(' AND ')}`;
  }

  baseQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const users = await new Promise((resolve, reject) => {
    db.all(baseQuery, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) as total FROM users';
  const countParams = [];

  if (role) {
    countQuery += ' WHERE role = ?';
    countParams.push(role);
  }

  const countResult = await new Promise((resolve, reject) => {
    db.get(countQuery, countParams, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  res.json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult.total,
      pages: Math.ceil(countResult.total / limit)
    }
  });
}));

// Get single user
router.get('/:id', [
  param('id').isInt().withMessage('User ID must be an integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const db = getDatabase();

  const user = await new Promise((resolve, reject) => {
    db.get('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    throw createError(404, 'User not found');
  }

  res.json(user);
}));

// Create user
router.post('/', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
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

// Update user
router.put('/:id', [
  param('id').isInt().withMessage('User ID must be an integer'),
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const { username, email, password, role } = req.body;
  const db = getDatabase();

  // Check if user exists
  const existingUser = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!existingUser) {
    throw createError(404, 'User not found');
  }

  // Prepare update data
  const updateData = {};
  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = email;
  if (password !== undefined) updateData.password_hash = await bcrypt.hash(password, 10);
  if (role !== undefined) updateData.role = role;
  
  updateData.updated_at = new Date().toISOString();

  if (Object.keys(updateData).length === 1) { // Only updated_at
    throw createError(400, 'No valid fields to update');
  }

  // Build update query
  const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
  const updateValues = Object.values(updateData);
  updateValues.push(id);

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
    db.get('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  res.json({
    message: 'User updated successfully',
    user: updatedUser
  });
}));

// Delete user
router.delete('/:id', [
  param('id').isInt().withMessage('User ID must be an integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const db = getDatabase();

  // Check if user exists
  const user = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    throw createError(404, 'User not found');
  }

  // Prevent deleting the last admin
  if (user.role === 'admin') {
    const adminCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (adminCount.count <= 1) {
      throw createError(400, 'Cannot delete the last admin user');
    }
  }

  // Delete user
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  res.json({ message: 'User deleted successfully' });
}));

module.exports = router; 