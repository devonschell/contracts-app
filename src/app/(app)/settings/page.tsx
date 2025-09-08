export default function SettingsPage() {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-4">Notifications</div>
          <div className="rounded-lg border bg-white p-4">Recipients</div>
          <div className="rounded-lg border bg-white p-4">Branding (logo)</div>
          <div className="rounded-lg border bg-white p-4">Billing</div>
        </div>
      </div>
    );
  }
  