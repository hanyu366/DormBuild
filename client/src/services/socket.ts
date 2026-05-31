import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/auth";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket() {
  const token = useAuthStore.getState().token;
  if (!token) {
    disconnectSocket();
    return;
  }

  if (socket?.connected) return;

  socket = io("/", {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected");
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

useAuthStore.subscribe((state, prevState) => {
  if (state.token !== prevState.token) {
    if (state.token) {
      connectSocket();
    } else {
      disconnectSocket();
    }
  }
});
