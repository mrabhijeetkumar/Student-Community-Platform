import { Server } from "socket.io";

let io;

export default function initializeSocket(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST", "PUT"]
        }
    });

    io.on("connection", (socket) => {
        socket.on("register", (userId) => {
            if (!userId) {
                return;
            }

            socket.join(`user:${userId}`);
        });
    });

    return io;
}

export function emitToUser(userId, eventName, payload) {
    if (!io || !userId) {
        return;
    }

    io.to(`user:${userId}`).emit(eventName, payload);
}
