// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve all static files (chat.html, chat.js, etc.) from the root directory
app.use(express.static(__dirname));

// When someone connects
io.on("connection", (socket) => {
  console.log("A user connected");

  // When a user sends a chat message
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg); // Send message to everyone
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Render uses process.env.PORT, default 3000 for local testing
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
