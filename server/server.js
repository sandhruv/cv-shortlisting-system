const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const { protect } = require("./middleware/authMiddleware");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://cv-shortlisting-system-3.onrender.com"],
    methods: ["GET", "POST"],
  },
});
const possibleClientDistPaths = [
  path.join(__dirname, "../client/dist"),
  path.join(__dirname, "client/dist"),
  path.join(process.cwd(), "client/dist"),
  path.join(process.cwd(), "dist"),
];
const clientDistPath = possibleClientDistPaths.find((candidate) => fs.existsSync(candidate)) || possibleClientDistPaths[0];

connectDB();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://cv-shortlisting-system-3.onrender.com"],
  credentials: true,
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/analytics", analyticsRoutes);

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

app.get(/^(?!\/api\/).*/, (req, res) => {
  const indexPath = path.join(clientDistPath, "index.html");
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  res.status(404).send("Frontend build not found. Run npm run build in the client folder.");
});

const rooms = new Map();

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, user }) => {
    if (!roomId) return;
    socket.join(roomId);
    const existing = rooms.get(roomId) || [];
    const members = [...existing.filter((m) => m.socketId !== socket.id), { socketId: socket.id, user }];
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

  socket.on("disconnect", () => {
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
