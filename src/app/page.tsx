import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import HomeLandingClient from "./HomeLandingClient";

export default async function HomePage() {
  const { userId } = await auth();

  // Logged-in users should NOT see the marketing site
  if (userId) {
    redirect("/dashboard");
  }

  // Logged-out users see marketing landing page
  return <HomeLandingClient loggedIn={false} />;
}
