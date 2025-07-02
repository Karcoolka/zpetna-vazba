const express = require('express');
const { body, validationResult, param, query } = require('express-validator');
const { getDatabase } = require('../database/init');
const { requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

// All routes require admin role
router.use(requireRole('admin'));

// Get global sections (intro and outro) - MUST BE BEFORE /:id route
router.get('/sections', asyncHandler(async (req, res) => {
  const db = getDatabase();

  // Get the global sections data from a settings table or create default
  const sections = await new Promise((resolve, reject) => {
    db.get(
      'SELECT intro_section, outro_section FROM global_sections WHERE id = 1',
      [],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (sections) {
    res.json({
      introSection: sections.intro_section ? JSON.parse(sections.intro_section) : [],
      outroSection: sections.outro_section ? JSON.parse(sections.outro_section) : []
    });
  } else {
    res.json({
      introSection: [],
      outroSection: []
    });
  }
}));

// Update global sections (intro and outro) - MUST BE BEFORE /:id route
router.put('/sections', [
  body('introSection').isArray().withMessage('Intro section must be an array'),
  body('outroSection').isArray().withMessage('Outro section must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { introSection, outroSection } = req.body;
  const db = getDatabase();

  // Upsert the global sections
  await new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO global_sections (id, intro_section, outro_section, updated_at)
       VALUES (1, ?, ?, ?)`,
      [
        JSON.stringify(introSection),
        JSON.stringify(outroSection),
        new Date().toISOString()
      ],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  res.json({
    message: 'Global sections updated successfully',
    introSection,
    outroSection
  });
}));

// Get global surveys list (admin only)
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('is_active').optional().isBoolean().withMessage('is_active must be boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { page = 1, limit = 10, is_active } = req.query;
  const offset = (page - 1) * limit;
  const db = getDatabase();

  let baseQuery = `
    SELECT gs.*, u.username as created_by_username
    FROM global_surveys gs
    LEFT JOIN users u ON gs.created_by = u.id
  `;
  
  const params = [];
  const conditions = [];

  if (is_active !== undefined) {
    conditions.push('gs.is_active = ?');
    params.push(is_active === 'true' ? 1 : 0);
  }

  if (conditions.length > 0) {
    baseQuery += ` WHERE ${conditions.join(' AND ')}`;
  }

  baseQuery += ` ORDER BY gs.updated_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  const globalSurveys = await new Promise((resolve, reject) => {
    db.all(baseQuery, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) as total FROM global_surveys gs';
  const countParams = [];

  if (is_active !== undefined) {
    countQuery += ' WHERE gs.is_active = ?';
    countParams.push(is_active === 'true' ? 1 : 0);
  }

  const countResult = await new Promise((resolve, reject) => {
    db.get(countQuery, countParams, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  res.json({
    globalSurveys: globalSurveys.map(survey => ({
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

// Get single global survey
router.get('/:id', [
  param('id').isInt().withMessage('Global survey ID must be an integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const db = getDatabase();

  const query = `
    SELECT gs.*, u.username as created_by_username
    FROM global_surveys gs
    LEFT JOIN users u ON gs.created_by = u.id
    WHERE gs.id = ?
  `;

  const globalSurvey = await new Promise((resolve, reject) => {
    db.get(query, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!globalSurvey) {
    throw createError(404, 'Global survey not found');
  }

  res.json({
    ...globalSurvey,
    config: JSON.parse(globalSurvey.config),
    is_active: Boolean(globalSurvey.is_active)
  });
}));

// Create global survey
router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('config').isObject().withMessage('Config must be an object'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { title, description, config, is_active = true } = req.body;
  const db = getDatabase();

  // Validate config structure
  if (!config.cards || !Array.isArray(config.cards)) {
    throw createError(400, 'Config must contain a cards array');
  }

  const result = await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO global_surveys (title, description, created_by, is_active, config) VALUES (?, ?, ?, ?, ?)',
      [title, description || null, req.user.id, is_active ? 1 : 0, JSON.stringify(config)],
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  // Get created global survey
  const newGlobalSurvey = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM global_surveys WHERE id = ?', [result.lastID], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  res.status(201).json({
    ...newGlobalSurvey,
    config: JSON.parse(newGlobalSurvey.config),
    is_active: Boolean(newGlobalSurvey.is_active)
  });
}));

// Update global survey
router.put('/:id', [
  param('id').isInt().withMessage('Global survey ID must be an integer'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('config').optional().isObject().withMessage('Config must be an object'),
  body('is_active').optional().isBoolean().withMessage('is_active must be boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const { title, description, config, is_active } = req.body;
  const db = getDatabase();

  // Check if global survey exists
  const existingGlobalSurvey = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM global_surveys WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!existingGlobalSurvey) {
    throw createError(404, 'Global survey not found');
  }

  // Validate config if provided
  if (config && (!config.cards || !Array.isArray(config.cards))) {
    throw createError(400, 'Config must contain a cards array');
  }

  // Prepare update data
  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (config !== undefined) updateData.config = JSON.stringify(config);
  if (is_active !== undefined) updateData.is_active = is_active ? 1 : 0;
  
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
      `UPDATE global_surveys SET ${updateFields} WHERE id = ?`,
      updateValues,
      function(err) {
        if (err) reject(err);
        else resolve(this);
      }
    );
  });

  // Get updated global survey
  const updatedGlobalSurvey = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM global_surveys WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  res.json({
    ...updatedGlobalSurvey,
    config: JSON.parse(updatedGlobalSurvey.config),
    is_active: Boolean(updatedGlobalSurvey.is_active)
  });
}));

// Delete global survey
router.delete('/:id', [
  param('id').isInt().withMessage('Global survey ID must be an integer')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError(400, 'Validation failed', errors.array());
  }

  const { id } = req.params;
  const db = getDatabase();

  // Check if global survey exists
  const globalSurvey = await new Promise((resolve, reject) => {
    db.get('SELECT * FROM global_surveys WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!globalSurvey) {
    throw createError(404, 'Global survey not found');
  }

  // Delete global survey
  await new Promise((resolve, reject) => {
    db.run('DELETE FROM global_surveys WHERE id = ?', [id], function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  res.json({ message: 'Global survey deleted successfully' });
}));

module.exports = router; 