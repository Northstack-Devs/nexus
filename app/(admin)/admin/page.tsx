"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  CreditCard,
  Loader2,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function AdminOverviewPage() {
  const currentUser = useQuery(api.admin.getCurrentUser, {});
  const users = useQuery(
    api.admin.listUsers,
    currentUser?.role === "admin" ? {} : "skip",
  );
  const roles = useQuery(
    api.admin.listRoles,
    currentUser?.role === "admin" ? {} : "skip",
  );
  const { results: subscriptionResults } = usePaginatedQuery(
    api.admin.listSubscriptions,
    currentUser?.role === "admin" ? {} : "skip",
    { initialNumItems: 8 },
  );
  const { results: planResults } = usePaginatedQuery(
    api.admin.listSubscriptionPlans,
    currentUser?.role === "admin" ? {} : "skip",
    { initialNumItems: 8 },
  );

  const metrics = useMemo(() => {
    if (!users) {
      return null;
    }
    const activeUsers = users.filter((user) => !user.isDeactivated).length;
    const adminUsers = users.filter((user) => user.role === "admin").length;
    return {
      totalUsers: users.length,
      activeUsers,
      adminUsers,
      deactivatedUsers: users.length - activeUsers,
    };
  }, [users]);

  if (currentUser === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading admin profile...
      </div>
    );
  }

  if (currentUser === null) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Sign in to access the admin dashboard.
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-lg font-semibold">Admin access required</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          Ask an administrator to grant your account admin permissions.
        </p>
      </div>
    );
  }

  if (users === undefined || roles === undefined || !metrics) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading overview...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard overview</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track the latest admin metrics and quick actions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total users
            </p>
            <span className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">{metrics.totalUsers}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {metrics.activeUsers} active accounts
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Admins
            </p>
            <span className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">{metrics.adminUsers}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Users with elevated access
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Deactivated
            </p>
            <span className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 flex items-center justify-center">
              <UserX className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">
            {metrics.deactivatedUsers}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Disabled accounts
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Roles defined
            </p>
            <span className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">{roles.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active role presets
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Subscriptions
            </p>
            <span className="h-9 w-9 rounded-xl bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 flex items-center justify-center">
              <CreditCard className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">
            {subscriptionResults.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {planResults.length} plans available
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <h3 className="text-sm font-semibold">Quick actions</h3>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition"
            >
              Manage users
            </Link>
            <Link
              href="/admin/roles"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Manage roles
            </Link>
            <Link
              href="/admin/subscriptions"
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Manage subscriptions
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
          <h3 className="text-sm font-semibold">Roles snapshot</h3>
          <div className="flex flex-wrap gap-2">
            {roles.length === 0 ? (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                No roles configured yet.
              </span>
            ) : (
              roles.map((role) => (
                <span
                  key={role._id}
                  className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  {role.name}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
