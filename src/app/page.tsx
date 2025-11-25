// src/app/page.tsx
import HomeLandingClient from "./HomeLandingClient";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { userId } = await auth();

  return <HomeLandingClient loggedIn={!!userId} />;
}
