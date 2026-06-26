"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { TopNav } from "./TopNav";
import { Footer } from "./Footer";

const NO_FOOTER = ["/login", "/signup"];

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showFooter = !NO_FOOTER.includes(pathname);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--color-canvas-soft)" }}>
      <TopNav />
      <main style={{ flex: 1 }}>{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
