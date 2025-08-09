require('dotenv').config();
const express = require('express');
// Removed cors package usage for simplified universal headers
const connectDB = require('./config/db');

// Initialize Express
const app = express();

// Trust proxy (Render/Netlify proxies)
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Universal CORS middleware (temporary broad allow to resolve failures)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json());

// Debug logging
app.use((req,res,next)=>{ console.log(`[REQ] ${req.method} ${req.path}`); next(); });

// Healthcheck & root endpoints for Render
app.get('/', (req, res) => {
  res.status(200).send('OK');
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Lightweight GET for /api/users (non-sensitive) before router
app.get('/api/users', (req,res)=>res.status(200).json({status:'ok'}));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/friends', require('./routes/friends'));

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} (UNIVERSAL CORS *)`));