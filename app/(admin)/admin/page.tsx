"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShieldCheck, Users, UserCheck } from "lucide-react";

export default function AdminDashboardPage() {
  const currentUser = useQuery(api.admin.getCurrentUser, {});
  const users = useQuery(
    api.admin.listUsers,
    currentUser?.role === "admin" ? {} : "skip",
  );

  if (currentUser === undefined) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
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

  if (users === undefined) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Loading users...
      </div>
    );
  }

  const adminCount = users.filter((user) => user.role === "admin").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">User management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review accounts and manage upcoming permissions.
          </p>
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500">
          Updated {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total users
            </p>
            <span className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">{users.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active accounts in the org
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Admins
            </p>
            <span className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">{adminCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Users with elevated access
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Pending roles
            </p>
            <span className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">
            {users.length - adminCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Awaiting admin review
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Accounts</h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {users.length} records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                >
                  <td className="px-4 py-3 font-medium">{user.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {user.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {user.isAnonymous ? "Anonymous" : "Active"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(user._creationTime).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
