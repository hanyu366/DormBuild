"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { DormState, UserSession } from "@/data/types";
import { loadUserSession, saveUserSession } from "@/lib/storage";
import { broadcastStateUpdate, initBroadcast, closeBroadcast } from "@/lib/broadcast";

type DormContextType = {
  state: DormState | null;
  session: UserSession | null;
  joinDorm: (nickname: string, dormCode: string, role: "member" | "leader") => Promise<void>;
  refreshState: () => Promise<void>;
  apiPost: (path: string, body: Record<string, string>) => Promise<void>;
  sendAiMessage: (message: string) => Promise<string>;
  clearSession: () => void;
};

const DormContext = createContext<DormContextType | null>(null);

export function useDorm() {
  const ctx = useContext(DormContext);
  if (!ctx) throw new Error("useDorm must be used within DormProvider");
  return ctx;
}

export function DormProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DormState | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);

  // Load session from localStorage and fetch state from server on mount
  useEffect(() => {
    const savedSession = loadUserSession();
    if (savedSession) {
      fetch(`/api/dorm/${savedSession.dormCode}`)
        .then((r) => r.json())
        .then((data) => {
          setSession(savedSession);
          setState(data as DormState);
        })
        .catch(() => setState(null));
    }
  }, []);

  // BroadcastChannel for multi-tab sync
  const activeDormCode = session?.dormCode;
  useEffect(() => {
    if (!activeDormCode) return;
    initBroadcast(activeDormCode, (remoteState) => {
      if (remoteState.dormCode === activeDormCode) setState(remoteState);
    });
    return () => { closeBroadcast(); };
  }, [activeDormCode]);

  const refreshState = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/dorm/${session.dormCode}`);
      const data = await res.json();
      setState(data as DormState);
      broadcastStateUpdate(data);
    } catch { /* ignore */ }
  }, [session]);

  // Generic API POST helper — calls API, updates state, broadcasts
  const apiPost = useCallback(async (path: string, body: Record<string, string>) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/dorm/${session.dormCode}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setState(data as DormState);
      broadcastStateUpdate(data);
    } catch { /* ignore */ }
  }, [session]);

  const joinDorm = useCallback(async (nickname: string, dormCode: string, role: "member" | "leader") => {
    try {
      const res = await fetch(`/api/dorm/${dormCode}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, role }),
      });
      const data = await res.json();
      const newSession: UserSession = { nickname, dormCode, role };
      setSession(newSession);
      setState(data as DormState);
      saveUserSession(newSession);
      broadcastStateUpdate(data);
    } catch { /* ignore */ }
  }, []);

  const sendAiMessage = useCallback(async (message: string): Promise<string> => {
    if (!session) return "";
    try {
      const res = await fetch("/api/ai/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dormCode: session.dormCode, userName: session.nickname, message }),
      });
      const data = await res.json();
      setState(data.state as DormState);
      broadcastStateUpdate(data.state);
      return data.reply as string;
    } catch {
      return "";
    }
  }, [session]);

  const clearSession = useCallback(() => {
    setSession(null);
    setState(null);
    localStorage.removeItem("dormmate_user_session");
  }, []);

  return (
    <DormContext.Provider value={{ state, session, joinDorm, refreshState, apiPost, sendAiMessage, clearSession }}>
      {children}
    </DormContext.Provider>
  );
}
