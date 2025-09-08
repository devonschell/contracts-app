export default function SignupPage() {
    return (
      <div className="mx-auto max-w-md py-16">
        <h1 className="text-2xl font-semibold mb-6">Create your account</h1>
        <form className="space-y-4">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="text"
            placeholder="Full name"
          />
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="email"
            placeholder="Work email"
          />
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="password"
            placeholder="Password"
          />
          <button className="w-full rounded-md bg-black px-3 py-2 text-white text-sm">
            Start Free Trial
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="underline">
            Log in
          </a>
        </p>
        <p className="mt-2 text-xs text-gray-400">
          (Stub only — we’ll connect real auth next.)
        </p>
      </div>
    );
  }
  