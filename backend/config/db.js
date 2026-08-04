const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edubridge_ai';
    console.log(`[DB] Attempting connection to MongoDB at: ${connStr}`);
    
    // Set short timeout for direct connection attempt so fallback works fast if local mongo isn't running
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[DB] MongoDB Connected successfully to external/local instance: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[DB] Could not connect to primary MongoDB instance (${err.message}). Starting MongoMemoryServer...`);
    try {
      mongoServer = await MongoMemoryServer.create();
      const uri = mongoServer.getUri();
      console.log(`[DB] MongoMemoryServer running at: ${uri}`);
      await mongoose.connect(uri);
      console.log(`[DB] MongoDB Connected successfully to Memory Server!`);
    } catch (memErr) {
      console.error(`[DB] Memory Server connection failed: ${memErr.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
