"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  Bell,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const currentUser = useQuery(api.admin.getCurrentUser, {});

  const initials = (currentUser?.name ?? currentUser?.email ?? "U")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950 shadow-lg shadow-slate-200/40 dark:shadow-none">
          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 p-[1px]">
                <div className="h-full w-full rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <div>
                <span className="text-slate-900 dark:text-white text-lg font-semibold">
                  Upty Admin
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Control center
                </p>
              </div>
            </div>
          </div>
          <nav className="px-4 space-y-1 text-sm">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 hover:translate-x-1"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 hover:translate-x-1"
            >
              <Users className="h-4 w-4" />
              User management
            </Link>
            <div className="px-3 pt-4 text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
              More soon
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900">
              <ShieldCheck className="h-4 w-4" />
              Roles & permissions
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-900">
              <Bell className="h-4 w-4" />
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
              <button className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition">
                <Bell className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 text-white flex items-center justify-center text-xs font-semibold">
                  {initials}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {currentUser?.name ?? currentUser?.email ?? "Guest"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentUser?.role ?? "viewer"}
                  </p>
                </div>
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
