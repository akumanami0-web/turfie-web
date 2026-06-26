"use client";
import React from "react";
import { SessionProvider } from "./session";
import { ToastProvider } from "./toast";
import { ShareProvider } from "./share";
import type { SessionUser } from "@/lib/types";

export function AppProviders({ user, children }: { user: SessionUser | null; children: React.ReactNode }) {
  return (
    <SessionProvider initialUser={user}>
      <ToastProvider>
        <ShareProvider>{children}</ShareProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
