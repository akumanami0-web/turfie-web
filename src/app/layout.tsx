import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { SiteChrome } from "@/components/chrome/SiteChrome";
import { getSessionUser } from "@/lib/auth";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-manrope", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "900"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Turfie — Book a turf near you",
  description:
    "Find a football pitch, box-cricket net or pickleball court near you across Maharashtra. Pick a slot, split the cost with your squad, and play.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body>
        <AppProviders user={user}>
          <SiteChrome>{children}</SiteChrome>
        </AppProviders>
      </body>
    </html>
  );
}
