import { create } from "zustand";
import type { User, AuthResponse } from "shared";
import api from "@/services/api";

interface AuthState {
  user: User | null;
  token: string | null;
  login: (nickname: string, password: string) => Promise<void>;
  register: (nickname: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),

  login: async (nickname, password) => {
    const { data } = await api.post<AuthResponse>("/auth/login", {
      nickname,
      password,
    });
    localStorage.setItem("token", data.token);
    set({ user: data.user, token: data.token });
  },

  register: async (nickname, password) => {
    const { data } = await api.post<AuthResponse>("/auth/register", {
      nickname,
      password,
    });
    localStorage.setItem("token", data.token);
    set({ user: data.user, token: data.token });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
  },

  setUser: (user) => set({ user }),
}));
