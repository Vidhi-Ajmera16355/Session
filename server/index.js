const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Resolve MongoDB DNS SRV issue by using Google's DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable response compression for performance
app.use(compression());

app.use(cors());
app.use(express.json());

// Apply rate limiting to all API endpoints to prevent abuse/DDoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// Routes
app.use('/api', require('./routes/registration'));

// Health check
app.get('/', (req, res) => res.json({ status: 'Server is running ✓' }));

// Connect to MongoDB then start server
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 100, // Handle high concurrency
  minPoolSize: 10,  // Keep a baseline of connections ready
})
  .then(() => {
    console.log('✓ MongoDB connected');
    app.listen(PORT, () => console.log(`✓ Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
  
