const { getDatabase } = require('../database/init');

const auditLogger = (req, res, next) => {
  // Skip audit logging for static files, health checks, and widget requests
  if (req.path.startsWith('/widget_') || 
      req.path === '/health' || 
      req.path.startsWith('/static/') ||
      req.method === 'GET' && !req.path.startsWith('/api/')) {
    return next();
  }

  const originalSend = res.send;
  const startTime = Date.now();

  res.send = function(data) {
    // Only log successful state-changing operations
    if (res.statusCode < 400 && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      logAuditEvent(req, res, data);
    }
    originalSend.call(this, data);
  };

  next();
};

const logAuditEvent = async (req, res, responseData) => {
  const db = getDatabase();
  
  try {
    const userId = req.user ? req.user.id : null;
    const action = getActionFromRequest(req);
    const resourceType = getResourceTypeFromPath(req.path);
    const resourceId = getResourceIdFromRequest(req);
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const details = JSON.stringify({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      requestBody: sanitizeRequestBody(req.body),
      timestamp: new Date().toISOString()
    });

    db.run(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, action, resourceType, resourceId, ipAddress, userAgent, details]);

  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't fail the request if audit logging fails
  }
};

const getActionFromRequest = (req) => {
  const method = req.method;
  const path = req.path;

  if (path.includes('/login')) return 'LOGIN';
  if (path.includes('/logout')) return 'LOGOUT';
  if (path.includes('/register')) return 'REGISTER';

  switch (method) {
    case 'POST':
      if (path.includes('/tokens')) return 'CREATE_TOKEN';
      if (path.includes('/surveys')) return 'CREATE_SURVEY';
      if (path.includes('/users')) return 'CREATE_USER';
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      if (path.includes('/tokens')) return 'UPDATE_TOKEN';
      if (path.includes('/surveys')) return 'UPDATE_SURVEY';
      if (path.includes('/users')) return 'UPDATE_USER';
      if (path.includes('/pause')) return 'PAUSE_TOKEN';
      if (path.includes('/resume')) return 'RESUME_TOKEN';
      return 'UPDATE';
    case 'DELETE':
      if (path.includes('/tokens')) return 'DELETE_TOKEN';
      if (path.includes('/surveys')) return 'DELETE_SURVEY';
      if (path.includes('/users')) return 'DELETE_USER';
      return 'DELETE';
    default:
      return 'UNKNOWN';
  }
};

const getResourceTypeFromPath = (path) => {
  if (path.includes('/surveys')) return 'SURVEY';
  if (path.includes('/tokens')) return 'TOKEN';
  if (path.includes('/users')) return 'USER';
  if (path.includes('/auth')) return 'AUTH';
  if (path.includes('/logs')) return 'LOG';
  return 'UNKNOWN';
};

const getResourceIdFromRequest = (req) => {
  // Extract ID from URL path parameters
  const pathParts = req.path.split('/');
  const idIndex = pathParts.findIndex(part => 
    ['surveys', 'tokens', 'users'].includes(part)
  ) + 1;
  
  if (idIndex > 0 && idIndex < pathParts.length) {
    const potentialId = pathParts[idIndex];
    if (potentialId && !isNaN(potentialId)) {
      return potentialId;
    }
  }

  // Try to get ID from request body
  if (req.body && req.body.id) {
    return req.body.id.toString();
  }

  return null;
};

const sanitizeRequestBody = (body) => {
  if (!body) return null;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.password_hash;
  delete sanitized.token;
  delete sanitized.secret;
  
  return sanitized;
};

// Manual audit logging function for specific events
const logManualAuditEvent = (userId, action, resourceType, resourceId, details, ipAddress, userAgent) => {
  const db = getDatabase();
  
  const auditDetails = JSON.stringify({
    ...details,
    timestamp: new Date().toISOString(),
    manual: true
  });

  db.run(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [userId, action, resourceType, resourceId, ipAddress, userAgent, auditDetails]);
};

module.exports = {
  auditLogger,
  logManualAuditEvent
}; 