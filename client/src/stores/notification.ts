import { create } from "zustand";
import type { Notification } from "shared";

interface NotificationState {
  list: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setList: (list: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  list: [],
  unreadCount: 0,

  addNotification: (notification) => {
    set((state) => ({
      list: [notification, ...state.list],
      unreadCount: state.unreadCount + (notification.read ? 0 : 1),
    }));
  },

  markRead: (id) => {
    set((state) => ({
      list: state.list.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, state.unreadCount - (state.list.find((n) => n.id === id && !n.read) ? 1 : 0)),
    }));
  },

  markAllRead: () => {
    set((state) => ({
      list: state.list.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  setList: (list) => {
    set({
      list,
      unreadCount: list.filter((n) => !n.read).length,
    });
  },
}));
