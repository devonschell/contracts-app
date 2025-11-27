// src/app/page.tsx
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();

  // Logged out → just show landing with simple props
  if (!userId) {
    return (
      // subscribed = false
      <HomeLandingClient loggedIn={false} subscribed={false} />
    );
  }

  // Logged in → fetch subscription status
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

  return (
    <HomeLandingClient
      loggedIn={true}
      subscribed={subscribed}
    />
  );
}
