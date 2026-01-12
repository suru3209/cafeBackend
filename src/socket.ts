import { Server } from "socket.io";
import http from "http";

let io: Server;

export const initSocket = (server: http.Server) => {
  const isProduction = process.env.NODE_ENV === "production";
  const corsOrigin = process.env.CLIENT_URL || (isProduction ? false : "http://localhost:3000");
  
  io = new Server(server, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 Admin connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 Admin disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
