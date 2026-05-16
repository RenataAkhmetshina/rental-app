require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { WebSocketServer } = require('ws');
const { setupWebSocket } = require('./utils/websocket');

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const leaseRoutes = require('./routes/leases');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// WebSocket 
const wss = new WebSocketServer({ server, path: '/ws' });
app.set('wss', wss);
setupWebSocket(wss);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rental_app')
    .then(() => {
      console.log('MongoDB connected');
      server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

module.exports = { app, server };
