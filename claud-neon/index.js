/**
 * NEON21 — Main API Server
 * Express backend for blackjack intelligence engine
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Next.js handles this on frontend
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id']
}));
app.use(express.json());

// Rate limiting (simple in-memory)
const rateLimiter = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 300;

  if (!rateLimiter.has(ip)) rateLimiter.set(ip, []);
  const requests = rateLimiter.get(ip).filter(t => now - t < windowMs);
  requests.push(now);
  rateLimiter.set(ip, requests);

  if (requests.length > maxRequests) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  next();
});

// Session validation middleware
app.use('/api', (req, res, next) => {
  const sessionId = req.headers['x-session-id'] || req.body?.sessionId;
  if (!sessionId && req.path !== '/health') {
    return res.status(400).json({ error: 'Session ID required' });
  }
  req.sessionId = sessionId;
  next();
});

// Routes
app.use('/api/count', require('./api/count'));
app.use('/api/predict', require('./api/predict'));
app.use('/api/recommend', require('./api/recommend'));
app.use('/api/stats', require('./api/stats'));
app.use('/api/reset', require('./api/reset'));
app.use('/api/health', require('./api/health'));

// Static UI fallback
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'neon-ui.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[NEON21 ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: Date.now()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[NEON21] Engine running on port ${PORT}`);
});

module.exports = app;
