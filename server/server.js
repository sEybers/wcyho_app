require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize Express
const app = express();

// Trust proxy (Render/Netlify proxies)
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Simplified & permissive CORS (reflect requesting origin) to resolve current blocking
const corsOptions = {
  origin: (origin, callback) => {
    console.log('[CORS] Incoming origin:', origin);
    return callback(null, true); // reflect any origin
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-auth-token'],
  credentials: false, // not using cookies; allows wildcard style reflection without credential risk
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Ensure CORS headers also appear on error responses
app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});

// Middleware
app.use(express.json());

// Debug logging
app.use((req,res,next)=>{ console.log(`[REQ] ${req.method} ${req.path} Origin:${req.headers.origin || 'n/a'}`); next(); });

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

// Error handler with CORS header reflection
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  }
  const status = err.message && err.message.includes('CORS') ? 403 : 500;
  res.status(status).json({ error: status === 403 ? 'CORS denied' : 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} (permissive CORS mode active)`));