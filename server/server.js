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

// Simplified CORS using ALLOWED_ORIGINS (comma separated)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://wcyho.netlify.app,http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(o => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // non-browser / curl
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.log('CORS blocked origin:', origin);
    return callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-auth-token'],
  optionsSuccessStatus: 204
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Debug logging
app.use((req,res,next)=>{ console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'n/a'}`); next(); });

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

// Simple GET for /api/users to satisfy probes / preflight (real user list not exposed)
app.get('/api/users', (req,res)=>res.status(200).json({status:'ok'}));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/friends', require('./routes/friends'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS denied' });
  }
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} env:${process.env.NODE_ENV || 'development'} allowedOrigins:${allowedOrigins.join('|')}`));