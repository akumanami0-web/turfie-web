"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import type { SessionUser } from "@/lib/types";

type Ctx = {
  user: SessionUser | null;
  setUser: (u: SessionUser | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<Ctx>({
  user: null,
  setUser: () => {},
  refresh: async () => {},
  logout: async () => {},
});

export function SessionProvider({ initialUser, children }: { initialUser: SessionUser | null; children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    const data = await res.json();
    setUser(data.user ?? null);
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return <SessionContext.Provider value={{ user, setUser, refresh, logout }}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
