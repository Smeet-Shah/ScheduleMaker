import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-zinc-100 p-8 space-y-6">
        <h1 className="text-3xl font-semibold text-zinc-900">
          ScheduleMaker
        </h1>
        <p className="text-zinc-600">
          Create a shareable page where people can mark when they&apos;re
          available and instantly see the best days and times for everyone.
        </p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-zinc-700">
          <li>Create an event in the admin area (choose dates and hours).</li>
          <li>Share the event link with your group.</li>
          <li>Watch the summary view to see the best time slots.</li>
        </ol>
        <div className="flex gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-4 h-10 rounded-md bg-zinc-900 text-zinc-50 text-sm font-medium hover:bg-zinc-800"
          >
            Go to admin
          </Link>
        </div>
        <p className="text-xs text-zinc-500">
          Once deployed to Vercel, set the admin passcode and database
          connection in your environment variables, then create your first
          event.
        </p>
      </div>
    </main>
  );
}

