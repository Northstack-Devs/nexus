"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const currentUser = useQuery(api.admin.getCurrentUser, {});

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated) {
      router.replace("/signin");
      return;
    }
    if (currentUser?.role === "admin") {
      router.replace("/admin");
    }
  }, [currentUser?.role, isAuthenticated, isLoading, router]);

  if (isLoading || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
        Redirecting...
      </div>
    );
  }

  if (currentUser?.role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
        Redirecting...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 shadow-2xl shadow-slate-200/40 dark:shadow-black/40 backdrop-blur p-8 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
            Nexus
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Access pending approval
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your account is active, but you don’t have admin access yet. Reach
            out to your workspace administrator to request access.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
          Signed in as {currentUser?.email ?? "your account"}.
        </div>
        <button
          type="button"
          onClick={() => signOut()}
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
