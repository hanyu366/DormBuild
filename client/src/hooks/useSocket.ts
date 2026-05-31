import { useEffect } from "react";
import { getSocket } from "@/services/socket";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";

export function useSocket() {
  const user = useAuthStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user?.dormId) return;

    socket.emit("join-dorm", user.dormId);

    const handleNotification = (data: unknown) => {
      addNotification(data as import("shared").Notification);
    };

    socket.on("notification", handleNotification);
    socket.on("expense-updated", handleNotification);
    socket.on("convention-updated", handleNotification);
    socket.on("vote-updated", handleNotification);
    socket.on("anonymous-message", handleNotification);

    return () => {
      socket.emit("leave-dorm", user.dormId);
      socket.off("notification", handleNotification);
      socket.off("expense-updated", handleNotification);
      socket.off("convention-updated", handleNotification);
      socket.off("vote-updated", handleNotification);
      socket.off("anonymous-message", handleNotification);
    };
  }, [user?.dormId, addNotification]);
}
