const express = require('express');
const { query, validationResult } = require('express-validator');
const { getDatabase } = require('../database/init');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

// Get audit logs (admin only)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('action').optional().trim().notEmpty().withMessage('Action cannot be empty'),
  query('resource_type').optional().trim().notEmpty().withMessage('Resource type cannot be empty'),
  query('user_id').optional().isInt().withMessage('User ID must be an integer'),
  query('from_date').optional().isISO8601().withMessage('From date must be a valid date'),
  query('to_date').optional().isISO8601().withMessage('To date must be a valid date')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { 
    page = 1, 
    limit = 50, 
    action, 
    resource_type, 
    user_id, 
    from_date, 
    to_date 
  } = req.query;
  
  const offset = (page - 1) * limit;
  const db = getDatabase();

  let baseQuery = `
    SELECT al.*, u.username, u.email
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
  `;
  
  const params = [];
  const conditions = [];

  // Apply filters
  if (action) {
    conditions.push('al.action = ?');
    params.push(action);
  }

  if (resource_type) {
    conditions.push('al.resource_type = ?');
    params.push(resource_type);
  }

  if (user_id) {
    conditions.push('al.user_id = ?');
    params.push(user_id);
  }

  if (from_date) {
    conditions.push('al.timestamp >= ?');
    params.push(from_date);
  }

  if (to_date) {
    conditions.push('al.timestamp <= ?');
    params.push(to_date);
  }

  if (conditions.length > 0) {
    baseQuery += ` WHERE ${conditions.join(' AND ')}`;
  }

  baseQuery += ` ORDER BY al.timestamp DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const logs = await new Promise((resolve, reject) => {
    db.all(baseQuery, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) as total FROM audit_logs al';
  const countParams = [];
  const countConditions = [];

  if (action) {
    countConditions.push('al.action = ?');
    countParams.push(action);
  }

  if (resource_type) {
    countConditions.push('al.resource_type = ?');
    countParams.push(resource_type);
  }

  if (user_id) {
    countConditions.push('al.user_id = ?');
    countParams.push(user_id);
  }

  if (from_date) {
    countConditions.push('al.timestamp >= ?');
    countParams.push(from_date);
  }

  if (to_date) {
    countConditions.push('al.timestamp <= ?');
    countParams.push(to_date);
  }

  if (countConditions.length > 0) {
    countQuery += ` WHERE ${countConditions.join(' AND ')}`;
  }

  const countResult = await new Promise((resolve, reject) => {
    db.get(countQuery, countParams, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  res.json({
    logs: logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult.total,
      pages: Math.ceil(countResult.total / limit)
    }
  });
}));

// Get audit log summary/statistics
router.get('/summary', asyncHandler(async (req, res) => {
  const db = getDatabase();

  // Get action counts
  const actionCounts = await new Promise((resolve, reject) => {
    db.all(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= datetime('now', '-30 days')
      GROUP BY action
      ORDER BY count DESC
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Get resource type counts
  const resourceCounts = await new Promise((resolve, reject) => {
    db.all(`
      SELECT resource_type, COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= datetime('now', '-30 days')
      GROUP BY resource_type
      ORDER BY count DESC
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Get daily activity for the last 7 days
  const dailyActivity = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        date(timestamp) as date,
        COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY date(timestamp)
      ORDER BY date DESC
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Get most active users
  const activeUsers = await new Promise((resolve, reject) => {
    db.all(`
      SELECT 
        u.username,
        u.email,
        COUNT(al.id) as activity_count
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.timestamp >= datetime('now', '-30 days')
        AND u.username IS NOT NULL
      GROUP BY al.user_id, u.username, u.email
      ORDER BY activity_count DESC
      LIMIT 10
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.json({
    actionCounts,
    resourceCounts,
    dailyActivity,
    activeUsers
  });
}));

// Get available filter options
router.get('/filters', asyncHandler(async (req, res) => {
  const db = getDatabase();

  // Get distinct actions
  const actions = await new Promise((resolve, reject) => {
    db.all('SELECT DISTINCT action FROM audit_logs ORDER BY action', (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(row => row.action));
    });
  });

  // Get distinct resource types
  const resourceTypes = await new Promise((resolve, reject) => {
    db.all('SELECT DISTINCT resource_type FROM audit_logs ORDER BY resource_type', (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map(row => row.resource_type));
    });
  });

  // Get users who have audit entries
  const users = await new Promise((resolve, reject) => {
    db.all(`
      SELECT DISTINCT u.id, u.username, u.email
      FROM users u
      INNER JOIN audit_logs al ON u.id = al.user_id
      ORDER BY u.username
    `, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  res.json({
    actions,
    resourceTypes,
    users
  });
}));

module.exports = router; 