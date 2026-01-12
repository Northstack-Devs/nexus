"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const currentUser = useQuery(api.admin.getCurrentUser, {});

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="px-6 py-5 font-semibold text-lg">
            <span className="text-slate-900 dark:text-white">Upty Admin</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Control center
            </p>
          </div>
          <nav className="px-4 space-y-1 text-sm">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              User management
            </Link>
            <div className="px-3 py-2 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              More soon
            </div>
            <div className="px-3 py-2 rounded-lg text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900">
              Roles & permissions
            </div>
            <div className="px-3 py-2 rounded-lg text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900">
              Audit logs
            </div>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur flex items-center justify-between px-6">
            <div>
              <h1 className="text-lg font-semibold">Admin dashboard</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage users and configuration
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {currentUser?.name ?? currentUser?.email ?? "Guest"}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentUser?.role ?? "viewer"}
                </p>
              </div>
              {isAuthenticated && (
                <button
                  className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 rounded-md text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition"
                  onClick={() =>
                    void signOut().then(() => {
                      router.push("/signin");
                    })
                  }
                >
                  Sign out
                </button>
              )}
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
