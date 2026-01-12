import { Server } from "socket.io";
let io;
export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL,
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
