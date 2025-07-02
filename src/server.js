const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initializeDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');
const surveyRoutes = require('./routes/surveys');
const globalSurveyRoutes = require('./routes/globalSurveys');
const tokenRoutes = require('./routes/tokens');
const userRoutes = require('./routes/users');
const logRoutes = require('./routes/logs');
const widgetRoutes = require('./routes/widgets');
const responseRoutes = require('./routes/responses');
const { authenticateToken, requireRole } = require('./middleware/auth');
const { auditLogger } = require('./middleware/audit');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      fontSrc: ["'self'", 'https:'],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Widget-specific rate limiting (more permissive)
const widgetLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 widget requests per minute
});
app.use('/widget_', widgetLimiter);

// Basic middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
}));

// Audit logging middleware
app.use(auditLogger);

// Static files for widgets (public access)
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', authenticateToken, surveyRoutes);
app.use('/api/global-surveys', authenticateToken, globalSurveyRoutes);
app.use('/api/tokens', authenticateToken, tokenRoutes);
app.use('/api/users', authenticateToken, requireRole('admin'), userRoutes);
app.use('/api/logs', authenticateToken, requireRole('admin'), logRoutes);
app.use('/api/widgets', widgetRoutes); // Public routes for widget embedding
app.use('/api/responses', responseRoutes); // Response submission (public) and statistics (authenticated)

// Serve React app (static files)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    // Don't serve React app for API routes or widget files
    if (req.path.startsWith('/api/') || req.path.startsWith('/widget_')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer(); 