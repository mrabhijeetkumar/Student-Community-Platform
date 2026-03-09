import { io } from "socket.io-client";

function deriveSocketUrl() {
    const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL;

    if (configuredSocketUrl) {
        return configuredSocketUrl.replace(/\/$/, "");
    }

    const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

    if (configuredApiBaseUrl) {
        return configuredApiBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
    }

    return "http://localhost:5050";
}

const SOCKET_URL = deriveSocketUrl();

let socketInstance = null;
let currentToken = "";
const connectionConsumers = new Set();

export function connectSocket(token, consumerId = "default") {
    if (!token) {
        return null;
    }

    connectionConsumers.add(consumerId);

    if (socketInstance && currentToken === token) {
        if (!socketInstance.connected) {
            socketInstance.connect();
        }

        return socketInstance;
    }

    if (socketInstance) {
        socketInstance.disconnect();
    }

    currentToken = token;
    socketInstance = io(SOCKET_URL, {
        auth: { token },
        autoConnect: false,
        transports: ["websocket", "polling"]
    });

    socketInstance.connect();

    return socketInstance;
}

export function subscribeToSocketEvent(eventName, handler) {
    if (!socketInstance) {
        return () => { };
    }

    socketInstance.on(eventName, handler);

    return () => {
        socketInstance?.off(eventName, handler);
    };
}

export function emitSocketEvent(eventName, payload) {
    if (!socketInstance) {
        return;
    }

    socketInstance.emit(eventName, payload);
}

export function disconnectSocket(consumerId = "default") {
    connectionConsumers.delete(consumerId);

    if (connectionConsumers.size > 0) {
        return;
    }

    if (!socketInstance) {
        return;
    }

    socketInstance.disconnect();
    socketInstance = null;
    currentToken = "";
}