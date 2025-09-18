// src/app/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    // If already signed in, go straight to the app
    redirect("/dashboard");
  }

  // Public landing page for signed-out visitors
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="font-semibold">YourLogo</div>
          <nav className="space-x-4 text-sm">
            <Link href="/login" className="underline">Login</Link>
            <Link
              href="/signup"
              className="rounded-md bg-black px-3 py-1.5 text-white"
            >
              Start Free Trial
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-4xl font-bold">
          See contract risks before they cost you.
        </h1>
        <p className="mt-3 text-gray-600 max-w-xl">
          Upload contracts, track renewals, and catch price increases automatically.
        </p>
        <div className="mt-6">
          <Link
            href="/signup"
            className="rounded-md bg-black px-4 py-2 text-white"
          >
            Start Free Trial
          </Link>
        </div>
      </main>
    </div>
  );
}
