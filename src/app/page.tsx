import Link from "next/link";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
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

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-4xl font-bold">
          See contract risks before they cost you.
        </h1>
        <p className="mt-3 text-gray-600 max-w-xl">
          Upload contracts, track renewals, and catch price increases
          automatically.
        </p>
        <div className="mt-6">
          <Link
            href="/signup"
            className="rounded-md bg-black px-4 py-2 text-white"
          >
            Start Free Trial
          </Link>
        </div>

        {/* Screenshot / teaser block */}
        <div className="mt-12 rounded-lg border p-8">
          [Dashboard screenshot placeholder]
        </div>

        {/* Feature cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border p-6">Auto Extraction</div>
          <div className="rounded-lg border p-6">Change Detection</div>
          <div className="rounded-lg border p-6">Renewal Alerts</div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t py-6 text-center text-sm text-gray-500">
        © YourCompany
      </footer>
    </div>
  );
}
