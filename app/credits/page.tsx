import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 shadow-2xl shadow-slate-200/40 dark:shadow-black/40 backdrop-blur">
        <CardHeader className="space-y-4">
          <div>
            <Link
              href="/signin"
              className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500 dark:text-indigo-300"
            >
              Back to sign in
            </Link>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold">Credits</CardTitle>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
              Thanks to the teams and open-source tools that power Nexus.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 text-sm text-slate-600 dark:text-slate-400">
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Nexus
            </p>
            <p>Built by the Northstack Devs team.</p>
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Open source
            </p>
            <p>
              Browse the code on{" "}
              <Link
                href="https://github.com/Northstack-Devs/nexus"
                className="font-medium text-slate-900 dark:text-white underline underline-offset-4"
              >
                GitHub
              </Link>
              .
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Core stack
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>Next.js and React for the UI</li>
              <li>Convex + Convex Auth for data and auth</li>
              <li>Tailwind CSS and Radix UI for styling</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
