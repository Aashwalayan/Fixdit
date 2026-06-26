const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db.cjs');
const authRoutes = require('./routes/authRoutes.cjs');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple welcome route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Fixdit Auth API Backend' });
});

// Auth Routes
app.use('/api/auth', authRoutes);

// Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Fixdit Auth server running on port ${PORT}`);
});
