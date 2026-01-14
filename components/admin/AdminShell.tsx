"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  CreditCard,
  FileText,
  Github,
  Info,
  LayoutDashboard,
  LogOut,
  Settings,
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

  const avatarUrl = currentUser?.imageUrl ?? null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950 shadow-lg shadow-slate-200/40 dark:shadow-none flex flex-col">
          <div className="px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 p-[1px]">
                <div className="h-full w-full rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-semibold">
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
              <div>
                <span className="text-slate-900 dark:text-white text-lg font-semibold">
                  Nexus Admin
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Convex-powered control center
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
              Dashboard overview
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 hover:translate-x-1"
            >
              <Users className="h-4 w-4" />
              User management
            </Link>
            <Link
              href="/admin/roles"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 hover:translate-x-1"
            >
              <ShieldCheck className="h-4 w-4" />
              Roles & permissions
            </Link>
            <Link
              href="/admin/subscriptions"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 hover:translate-x-1"
            >
              <CreditCard className="h-4 w-4" />
              Subscriptions
            </Link>
            <Link
              href="/admin/logs"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 hover:translate-x-1"
            >
              <FileText className="h-4 w-4" />
              Audit logs
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200 hover:translate-x-1"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
          <div className="mt-auto px-4 pb-6 pt-4 text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <Link
              href="/credits"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
            >
              <Info className="h-4 w-4" />
              Credits
            </Link>
            <a
              href="https://github.com/Northstack-Devs/nexus"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur flex items-center justify-between px-6">
            <div>
              <h1 className="text-lg font-semibold">Nexus admin dashboard</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitor Nexus users and configuration
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition">
                <Bell className="h-4 w-4" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg px-2 py-1.5 transition">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatarUrl ?? undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 text-white text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium">
                        {currentUser?.name ?? currentUser?.email ?? "Guest"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {currentUser?.role ?? "viewer"}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {currentUser?.name ?? currentUser?.email ?? "Guest"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {currentUser?.email ?? ""}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isAuthenticated && (
                    <DropdownMenuItem
                      className="text-red-600 dark:text-red-400"
                      onClick={() =>
                        void signOut().then(() => {
                          router.push("/signin");
                        })
                      }
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
