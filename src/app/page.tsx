// app/page.tsx
import type { Metadata } from "next";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Oviu — AI-Powered Contract Intelligence",
  description:
    "Organize, summarize, and track every contract in one place with AI. Automatic renewal alerts, weekly digests, and a clean dashboard.",
  openGraph: {
    title: "Oviu — AI-Powered Contract Intelligence",
    description:
      "Organize, summarize, and track every contract in one place with AI. Automatic renewal alerts, weekly digests, and a clean dashboard.",
    url: "https://oviu.app", // optional; update to your live domain when ready
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Oviu — AI-Powered Contract Intelligence",
    description:
      "Organize, summarize, and track every contract in one place with AI.",
  },
};

import HomeLandingClient from "./HomeLandingClient";

export default function Page() {
  return <HomeLandingClient />;
}
