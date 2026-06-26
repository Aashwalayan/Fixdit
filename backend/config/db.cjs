const mongoose = require('mongoose');

const connectDB = async () => {
  let mongoUrl = process.env.MONGODB_URL;
  
  if (!mongoUrl || mongoUrl === 'your_mongodb_connection_string' || mongoUrl.includes('placeholder')) {
    console.log('ℹ️ MONGODB_URL is not fully configured. Using default local MongoDB connection string.');
    mongoUrl = 'mongodb://127.0.0.1:27017/fixdit';
  }

  try {
    // Explicitly target the 'fixdit' database via connection options to prevent any mismatch
    // Set serverSelectionTimeoutMS to 5000ms to fail fast instead of blocking for 30s
    const conn = await mongoose.connect(mongoUrl, {
      dbName: 'fixdit',
      serverSelectionTimeoutMS: 5000
    });
    console.log(`✅ MongoDB Connected to database: "${conn.connection.db.databaseName}" at host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    console.warn('⚠️ Connecting to local MongoDB failed. Double check if the database service is running.');
    return false;
  }
};

module.exports = connectDB;
