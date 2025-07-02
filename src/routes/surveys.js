const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const { getDatabase } = require('../database/init');
const { requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

// Get surveys list (users see own, admin sees all)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['draft', 'active', 'paused', 'completed']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;
  const db = getDatabase();

  // Build query based on user role
  let baseQuery = `
    SELECT s.*, u.username as owner_username,
           COUNT(st.id) as token_count,
           CASE WHEN COUNT(CASE WHEN st.status = 'active' THEN 1 END) > 0 THEN 1 ELSE 0 END as is_active
    FROM surveys s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN survey_tokens st ON s.id = st.survey_id
  `;
  
  const params = [];
  const conditions = [];

  // Role-based filtering
  if (req.user.role !== 'admin') {
    conditions.push('s.user_id = ?');
    params.push(req.user.id);
  }

  // Status filtering
  if (status) {
    conditions.push('s.status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    baseQuery += ` WHERE ${conditions.join(' AND ')}`;
  }

  baseQuery += ` GROUP BY s.id ORDER BY s.updated_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const surveys = await new Promise((resolve, reject) => {
    db.all(baseQuery, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) as total FROM surveys s';
  const countParams = [];
  const countConditions = [];

  if (req.user.role !== 'admin') {
    countConditions.push('s.user_id = ?');
    countParams.push(req.user.id);
  }

  if (status) {
    countConditions.push('s.status = ?');
    countParams.push(status);
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
    surveys: surveys.map(survey => ({
      ...survey,
      config: JSON.parse(survey.config),
      is_active: Boolean(survey.is_active)
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult.total,
      pages: Math.ceil(countResult.total / limit)
    }
  });
}));

// Get single survey
router.get('/:id', [
  param('id').isInt().withMessage('Survey ID must be an integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const db = getDatabase();

  let query = `
    SELECT s.*, u.username as owner_username,
           COUNT(st.id) as token_count,
           CASE WHEN COUNT(CASE WHEN st.status = 'active' THEN 1 END) > 0 THEN 1 ELSE 0 END as is_active
    FROM surveys s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN survey_tokens st ON s.id = st.survey_id
    WHERE s.id = ?
  `;
  const params = [id];

  // Non-admin users can only see their own surveys
  if (req.user.role !== 'admin') {
    query += ' AND s.user_id = ?';
    params.push(req.user.id);
  }

  query += ' GROUP BY s.id';

  const survey = await new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!survey) {
    throw createError(404, 'Survey not found');
  }

  res.json({
    ...survey,
    config: JSON.parse(survey.config),
    is_active: Boolean(survey.is_active)
  });
}));

// Create survey
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('config').isObject().withMessage('Config must be an object'),
  body('status').optional().isIn(['draft', 'active']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { title, description, config, status = 'draft' } = req.body;
  const db = getDatabase();

  // Validate config structure (basic validation)
  if (!config.steps || !Array.isArray(config.steps)) {
    throw createError(400, 'Config must contain a steps array');
  }

  const result = await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO surveys (title, description, user_id, status, config) VALUES (?, ?, ?, ?, ?)',
      [title, description || null, req.user.id, status, JSON.stringify(config)],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  // Get created survey
  const newSurvey = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM surveys WHERE id = ?', [result.lastID], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  res.status(201).json({
    ...newSurvey,
    config: JSON.parse(newSurvey.config)
  });
}));

// Update survey
router.put('/:id', [
  param('id').isInt().withMessage('Survey ID must be an integer'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('config').optional().isObject().withMessage('Config must be an object'),
  body('status').optional().isIn(['draft', 'active', 'paused', 'completed']).withMessage('Invalid status')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const { title, description, config, status } = req.body;
  const db = getDatabase();

  // Check if survey exists and user has permission
  let checkQuery = 'SELECT * FROM surveys WHERE id = ?';
  const checkParams = [id];

  if (req.user.role !== 'admin') {
    checkQuery += ' AND user_id = ?';
    checkParams.push(req.user.id);
  }

  const existingSurvey = await new Promise((resolve, reject) => {
    db.get(checkQuery, checkParams, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!existingSurvey) {
    throw createError(404, 'Survey not found');
  }

  // Validate config if provided
  if (config && (!config.steps || !Array.isArray(config.steps))) {
    throw createError(400, 'Config must contain a steps array');
  }

  // Prepare update data
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (config !== undefined) updateData.config = JSON.stringify(config);
  if (status !== undefined) updateData.status = status;
  
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
      `UPDATE surveys SET ${updateFields} WHERE id = ?`,
      updateValues,
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  // Get updated survey
  const updatedSurvey = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM surveys WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  res.json({
    ...updatedSurvey,
    config: JSON.parse(updatedSurvey.config)
  });
}));

// Delete survey
router.delete('/:id', [
  param('id').isInt().withMessage('Survey ID must be an integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const db = getDatabase();

  // Check if survey exists and user has permission
  let checkQuery = 'SELECT * FROM surveys WHERE id = ?';
  const checkParams = [id];

  if (req.user.role !== 'admin') {
    checkQuery += ' AND user_id = ?';
    checkParams.push(req.user.id);
  }

  const survey = await new Promise((resolve, reject) => {
    db.get(checkQuery, checkParams, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!survey) {
    throw createError(404, 'Survey not found');
  }

  // Delete survey (cascade delete handled by foreign key constraints)
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM surveys WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  res.json({ message: 'Survey deleted successfully' });
}));

// Get survey responses
router.get('/:id/responses', [
  param('id').isInt().withMessage('Survey ID must be an integer'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const db = getDatabase();

  // Check if survey exists and user has permission
  let checkQuery = 'SELECT * FROM surveys WHERE id = ?';
  const checkParams = [id];

  if (req.user.role !== 'admin') {
    checkQuery += ' AND user_id = ?';
    checkParams.push(req.user.id);
  }

  const survey = await new Promise((resolve, reject) => {
    db.get(checkQuery, checkParams, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!survey) {
    throw createError(404, 'Survey not found');
  }

  // Get responses
  const responses = await new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM survey_responses WHERE survey_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [id, parseInt(limit), parseInt(offset)],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  // Get total count
  const countResult = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as total FROM survey_responses WHERE survey_id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  res.json({
    responses: responses.map(response => ({
      ...response,
      response_data: JSON.parse(response.response_data)
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: countResult.total,
      pages: Math.ceil(countResult.total / limit)
    }
  });
}));

module.exports = router; 