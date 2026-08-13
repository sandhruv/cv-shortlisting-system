const path = require("path");
const dotenv = require("dotenv");
const dotenvResult = dotenv.config({ path: path.join(__dirname, ".env") });
if (dotenvResult.error && dotenvResult.error.code !== "ENOENT") {
  console.error("❌ Failed to load .env file:", dotenvResult.error.message);
  process.exit(1);
}
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const codingTestRoutes = require("./routes/codingTestRoutes");
const compileRoutes    = require("./routes/compileRoutes");
const profileRoutes    = require("./routes/profileRoutes");
const profileSubmissionRoutes = require("./routes/profileSubmissionRoutes");
const { protect } = require("./middleware/authMiddleware");

const app = express();
const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "https://cv-shortlisting-system-2.onrender.com",
  "https://cv-shortlisting-system-3.onrender.com",
  "https://cv-shortlisting-system.onrender.com",
  process.env.CLIENT_ORIGIN,
].filter(Boolean);
const corsOriginHandler = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  return callback(new Error("Not allowed by CORS"));
};
const io = new Server(server, {
  cors: {
    origin: corsOriginHandler,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});
const possibleClientDistPaths = [
  path.join(__dirname, "../client/dist"),
  path.join(__dirname, "client/dist"),
  path.join(process.cwd(), "client/dist"),
  path.join(process.cwd(), "dist"),
];
const clientDistPath = possibleClientDistPaths.find((candidate) => fs.existsSync(candidate)) || possibleClientDistPaths[0];

const requiredEnv = ["MONGO_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error("❌ Missing required environment variables:", missingEnv.join(", "));
  process.exit(1);
}

connectDB();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later.",
});

const signalingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many signaling requests.",
});

app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:", "http:", "https:", "stun:", "turn:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      mediaSrc: ["'self'", "blob:", "data:", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      frameSrc: ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: corsOriginHandler,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(limiter);
app.use(hpp());
app.use(express.json({ limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/coding-tests", codingTestRoutes);
app.use("/api/compile",      compileRoutes);
app.use("/api/profile",     profileRoutes);
app.use("/api/profile-submissions", profileSubmissionRoutes);

app.get("/api/profile", protect, (req, res) => {
  res.json({
    message: "You have access to protected route",
    user: req.user,
  });
});

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.head("/api/health", (req, res) => {
  res.status(200).end();
});

app.head("/api/head", (req, res) => {
  res.status(200).end();
});

app.get("/api/head", (req, res) => {
  res.json({ status: "ok", message: "HEAD route active" });
});

app.get(/^(?!\/api\/).*/, (req, res) => {
  const indexPath = path.join(clientDistPath, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  res.status(404).send("Frontend build not found. Run npm run build in the client folder.");
});

const rooms = new Map();
const proctorFrameTimestamps = new Map();

io.use((socket, next) => {
  const authHeader = socket.handshake.headers?.authorization;
  const token = socket.handshake.auth?.token || (typeof authHeader === "string" ? authHeader.replace("Bearer ", "") : undefined);

  if (token) {
    try {
      if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not configured");
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      return next();
    } catch (err) {
      console.warn("Socket auth failed, falling back to guest user:", err.message);
    }
  }

  socket.user = {
    id: socket.id,
    role: socket.handshake.auth?.role || "Student",
    name: socket.handshake.auth?.name || "Guest",
  };
  return next();
});

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, user }) => {
    if (!roomId) return;
    socket.join(roomId);
    const existing = rooms.get(roomId) || [];
    const joinedUser = user && typeof user === "object" ? user : socket.user;
    const members = [
      ...existing.filter((m) => m.socketId !== socket.id),
      {
        socketId: socket.id,
        user: {
          id: joinedUser?.id || socket.id,
          role: joinedUser?.role || "Student",
          name: joinedUser?.name || "Guest",
        },
      },
    ];
    rooms.set(roomId, members);
    io.to(roomId).emit("room-users", members);
  });

  socket.on("leave-room", ({ roomId }) => {
    if (!roomId) return;
    socket.leave(roomId);
    const existing = (rooms.get(roomId) || []).filter((m) => m.socketId !== socket.id);
    rooms.set(roomId, existing);
    io.to(roomId).emit("room-users", existing);
  });

  socket.on("signal", ({ roomId, to, signal }) => {
    if (!roomId || !signal) return;
    if (to) {
      socket.to(to).emit("signal", { from: socket.id, signal });
    } else {
      socket.to(roomId).emit("signal", { from: socket.id, signal });
    }
  });

  socket.on("reaction", ({ roomId, emoji }) => {
    if (!roomId || !emoji) return;
    socket.to(roomId).emit("reaction", { emoji });
  });

  // Live camera proctoring
  socket.on("join-proctor", ({ testId }) => {
    if (!testId) return;
    socket.join(`proctor-${testId}`);
  });

  // Rate-limited proctor frame handling
  socket.on("proctor-frame", ({ testId, frame }) => {
    if (!testId || !frame) return;

    // Rate limit: max 1 frame per 2 seconds per socket
    const now = Date.now();
    const lastFrame = proctorFrameTimestamps.get(socket.id) || 0;
    if (now - lastFrame < 2000) return; // Silently drop excess frames
    proctorFrameTimestamps.set(socket.id, now);

    // Validate frame size (reject oversized frames to prevent abuse)
    if (frame.length > 500000) return; // ~500KB max frame size

    socket.to(`proctor-${testId}`).emit("proctor-frame", { testId, frame, timestamp: Date.now() });
  });

  socket.on("disconnect", () => {
    proctorFrameTimestamps.delete(socket.id);
    for (const [roomId, members] of rooms.entries()) {
      const updated = members.filter((u) => u.socketId !== socket.id);
      if (updated.length !== members.length) {
        rooms.set(roomId, updated);
        io.to(roomId).emit("room-users", updated);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
