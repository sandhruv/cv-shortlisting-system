const mongoose = require("mongoose");

let dbConnected = false;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 50,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
    });
    dbConnected = true;
    console.log("✅ MongoDB Connected (pool: 50)");
  } catch (err) {
    dbConnected = false;
    console.error("❌ MongoDB Error:", err.message);
  }
};

function isDBConnected() {
  return dbConnected && mongoose.connection.readyState === 1;
}

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;
