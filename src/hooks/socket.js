// src/socket.js
import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem("token");
  const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      path: "/socket.io",
      auth: { token },   // ✅ match backend socket.handshake.auth.token
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.on("connect_error", (err) => {
      console.error("⚠️ Socket connection error:", err.message);
      
      // Inform user if it's likely a backend wake-up issue
      if (err.message.includes('websocket error') || err.message.includes('xhr poll error')) {
        console.warn("💤 Backend may be sleeping (Render free tier). It will wake up in ~30-60 seconds.");
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log("🔄 Reconnection attempt", attemptNumber);
    });

    socket.on("reconnect_error", (err) => {
      console.error("❌ Reconnection error:", err.message);
    });

    socket.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed");
    });
  }

  return socket;
};

export const getSocket = () => socket;
