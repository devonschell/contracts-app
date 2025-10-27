// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Providers from "./Providers";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Contracts App",
  description: "Contract Intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
