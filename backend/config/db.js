const mongoose = require('mongoose');
const dns = require('dns');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set public DNS servers to resolve MongoDB Atlas SRV records on Windows/ISPs
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('[DB] Custom DNS setup warning:', dnsErr.message);
}

let mongoServer;

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/edubridge_ai';
    console.log(`[DB] Attempting connection to MongoDB at: ${connStr.replace(/:([^@]+)@/, ':****@')}`);
    
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 10000,
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

