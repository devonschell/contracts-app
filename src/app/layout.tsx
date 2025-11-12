// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Providers from "./Providers";

export const metadata: Metadata = {
  title: "OVIU — Contract Intelligence",
  description:
    "AI-powered platform to organize, summarize, and track contracts with renewal alerts and insights.",
  icons: {
    icon: "/brand/oviu-logo.png",   // favicon + tab icon
    apple: "/brand/oviu-logo.png",  // iOS home screen
  },
  themeColor: "#6B5BFF",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  openGraph: {
    title: "OVIU — Contract Intelligence",
    description:
      "Organize, summarize, and track every contract with AI. Never miss a renewal.",
    url: "https://your-live-site-url.example", // optional; replace with your domain when ready
    siteName: "OVIU",
    images: [{ url: "/brand/oviu-logo.png", width: 1200, height: 630, alt: "OVIU" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OVIU — Contract Intelligence",
    description:
      "Organize, summarize, and track every contract with AI. Never miss a renewal.",
    images: ["/brand/oviu-logo.png"],
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
