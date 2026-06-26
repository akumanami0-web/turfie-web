"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";

type ToastType = "success" | "error" | "warning";
type Toast = { msg: string; type: ToastType };
const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const show = useCallback((msg: string, type: ToastType = "success") => setToast({ msg, type }), []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2800);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const isErr = toast && (toast.type === "error" || toast.type === "warning");
  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 9998, background: "var(--color-ink)", color: "var(--color-canvas)", padding: "14px 22px", borderRadius: "var(--radius-pill)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 15, boxShadow: "var(--shadow-pop)", display: "flex", alignItems: "center", gap: 10, maxWidth: "90vw" }}>
          {isErr ? (
            <span style={{ display: "grid", placeItems: "center", width: 20, height: 20, borderRadius: "50%", background: "var(--color-warning)", flexShrink: 0 }}>
              <Icon name="x" size={13} color="var(--color-ink)" stroke={3} />
            </span>
          ) : (
            <Icon name="checkCircle" size={18} color="var(--color-primary)" />
          )}
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
