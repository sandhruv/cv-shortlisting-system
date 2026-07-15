const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,        // 30s to find a server
      socketTimeoutMS: 45000,                 // Close sockets after 45s of inactivity
      connectTimeoutMS: 30000,                // 30s to connect
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      family: 4,                              // Use IPv4 (bypass IPv6 issues)
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
