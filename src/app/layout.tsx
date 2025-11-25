// src/app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import Providers from "./Providers";

export const runtime = "nodejs";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#6B5BFF",
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL &&
  process.env.NEXT_PUBLIC_SITE_URL.startsWith("http")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "http://localhost:3002";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "OVIU — Contract Intelligence",
  description:
    "AI-powered platform to organize, summarize, and track contracts with renewal alerts and insights.",
  icons: {
    icon: "/brand/oviu-logo.png",
    apple: "/brand/oviu-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
