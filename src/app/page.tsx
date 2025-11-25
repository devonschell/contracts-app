// src/app/page.tsx
import { auth } from "@clerk/nextjs/server";
import HomeLandingClient from "./HomeLandingClient";

export default async function HomePage() {
  const { userId } = await auth();

  return <HomeLandingClient loggedIn={!!userId} />;
}
