// src/app/page.tsx
import { auth } from "@clerk/nextjs/server";
import HomeLandingClient from "./HomeLandingClient";   // ← THIS LINE WAS MISSING

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    return <HomeLandingClient loggedIn={false} subscribed={false} />;
  }

  let subscribed = false;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/billing`, {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    subscribed = !!data.subscribed;
  } catch {
    subscribed = false;
  }

  return <HomeLandingClient loggedIn={true} subscribed={subscribed} />;
}
