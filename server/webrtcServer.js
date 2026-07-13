const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, user }) => {
    socket.join(roomId);
    const existing = rooms.get(roomId) || [];
    rooms.set(roomId, [...existing, { socketId: socket.id, user }]);
    io.to(roomId).emit("room-users", rooms.get(roomId));
  });

  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId);
    const existing = (rooms.get(roomId) || []).filter((u) => u.socketId !== socket.id);
    rooms.set(roomId, existing);
    io.to(roomId).emit("room-users", existing);
  });

  socket.on("signal", ({ roomId, signal }) => {
    socket.to(roomId).emit("signal", { socketId: socket.id, signal });
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

const PORT = process.env.WEBRTC_PORT || 6000;
server.listen(PORT, () => {
  console.log(`WebRTC signaling server running on port ${PORT}`);
});
