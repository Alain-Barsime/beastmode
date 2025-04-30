const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const users = {};

io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on("register", (userId) => { 
    users[userId] = socket.id;
    socket.userId = userId;
    console.log(`[REGISTER] User ${userId} registered with socket ${socket.id}`);
    console.log(`[USERS] Current users:`, users);
  });

  socket.on("offer", ({ offer, to, from }) => {
    console.log(`[OFFER] Received offer from ${from} to ${to}`);
    const receiverSocketId = users[to];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("offer", { offer, from });
      console.log(`[OFFER] Forwarded offer from ${from} to ${to} (socket: ${receiverSocketId})`);
    }
  });
  
  socket.on("answer", ({ answer, to, from }) => {
    console.log(`[ANSWER] Received answer from ${from} to ${to}`);
    const toSocket = users[to];
    if (toSocket) {
      io.to(toSocket).emit("answer", { answer, from });
      console.log(`[ANSWER] Forwarded answer from ${from} to ${to} (socket: ${toSocket})`);
    } else {
      console.warn(`[ANSWER] No such receiverId: ${to}`);
      io.to(socket.id).emit("receiver-not-found", to);
    }
  });   

  
  
  socket.on("new-ice-candidate", ({ candidate, to, from }) => {
    console.log(`[ICE] New ICE candidate from ${from} to ${to}`);
    const toSocket = users[to];
    if (toSocket) {
      io.to(toSocket).emit("new-ice-candidate", { candidate, from });
      console.log(`[ICE] Forwarded ICE candidate from ${from} to ${to}`);
    } else {
      console.warn(`[ICE] No such receiverId: ${to}`);
    }
  });


  socket.on("hangup", (receiverId) => {
    console.log(`[HANGUP] ${socket.userId} wants to hang up with ${receiverId}`);
    const toSocket = users[receiverId];
    if (toSocket) {
      io.to(toSocket).emit("hangup");
      console.log(`[HANGUP] Informed ${receiverId} about hangup.`);
    } else {
      console.warn(`[HANGUP] No such receiverId: ${receiverId}`);
    }
  });

  socket.on("disconnect", (reason) => {
    if (socket.userId) {
      delete users[socket.userId];
      console.log(`[DISCONNECT] User ${socket.userId} disconnected. Reason: ${reason}`);
      console.log(`[USERS] Current users:`, users);
    } else {
      console.log(`[DISCONNECT] An unregistered socket disconnected: ${socket.id}. Reason: ${reason}`);
    }
  });

  socket.on("error", (error) => {
    console.error(`[SOCKET ERROR] ${socket.id}:`, error);
  });
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
