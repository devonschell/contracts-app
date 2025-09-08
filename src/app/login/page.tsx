export default function LoginPage() {
    return (
      <div className="mx-auto max-w-md py-16">
        <h1 className="text-2xl font-semibold mb-6">Log in</h1>
        <form className="space-y-4">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="email"
            placeholder="Email"
          />
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="password"
            placeholder="Password"
          />
          <button className="w-full rounded-md bg-black px-3 py-2 text-white text-sm">
            Continue
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="underline">
            Sign up
          </a>
        </p>
        <p className="mt-2 text-xs text-gray-400">
          (Auth is stubbed for now. We can wire it to Clerk/Auth.js/Supabase next.)
        </p>
      </div>
    );
  }
  