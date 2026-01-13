export default function ServerPage() {
  return (
    <main className="p-8 flex flex-col gap-6 mx-auto max-w-2xl">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-200">
          Server-rendered route
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          This route is intentionally minimal in the Nexus template. Use it for
          server components or remove it if you do not need a public server
          page.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-sm text-slate-600 dark:text-slate-400">
        Add your own server-side queries here when needed.
      </div>
    </main>
  );
}
