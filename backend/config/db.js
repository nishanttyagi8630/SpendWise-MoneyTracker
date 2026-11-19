// Database Connection Module
// Connects to MongoDB with Mongoose.
// If MongoDB is not running locally, it enables a fallback local store so the app never crashes.

const mongoose = require('mongoose');

let isMongoConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spendwise';
  
  try {
    // Attempt connection with a short timeout to not hang if MongoDB is not running
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500, // 2.5 seconds timeout
    });
    isMongoConnected = true;
    console.log(`✅ MongoDB Connected Successfully: ${mongoose.connection.host}`);
  } catch (error) {
    isMongoConnected = false;
    console.warn(`⚠️ MongoDB connection failed: ${error.message}`);
    console.info(`ℹ️ SpendWise is running with local persistent data fallback in 'backend/data/local_db.json'.`);
    console.info(`ℹ️ To use MongoDB, make sure MongoDB is running or update MONGO_URI in your .env file.`);
  }
};

const getIsConnected = () => isMongoConnected;

module.exports = {
  connectDB,
  getIsConnected
};
