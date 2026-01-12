"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Pencil,
  Plus,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";

interface UserRow {
  _id: Id<"users">;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  image: string | null;
  isAnonymous: boolean;
  isDeactivated: boolean;
  _creationTime: number;
}

interface UserFormState {
  name: string;
  email: string;
  phone: string;
  image: string;
  role: string;
}

const emptyForm: UserFormState = {
  name: "",
  email: "",
  phone: "",
  image: "",
  role: "user",
};

export default function AdminDashboardPage() {
  const currentUser = useQuery(api.admin.getCurrentUser, {});
  const users = useQuery(
    api.admin.listUsers,
    currentUser?.role === "admin" ? {} : "skip",
  ) as UserRow[] | undefined;
  const roles = useQuery(
    api.admin.listRoles,
    currentUser?.role === "admin" ? {} : "skip",
  );
  const createUser = useMutation(api.admin.createUser);
  const updateUser = useMutation(api.admin.updateUser);
  const deactivateUser = useMutation(api.admin.deactivateUser);
  const reactivateUser = useMutation(api.admin.reactivateUser);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [formState, setFormState] = useState<UserFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const adminCount = useMemo(
    () => (users ? users.filter((user) => user.role === "admin").length : 0),
    [users],
  );
  const activeCount = useMemo(
    () => (users ? users.filter((user) => !user.isDeactivated).length : 0),
    [users],
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

  if (users === undefined || roles === undefined) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Loading users...
      </div>
    );
  }

  const handleOpenCreate = () => {
    setFormState(emptyForm);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: UserRow) => {
    setEditingUser(user);
    setFormState({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      image: user.image ?? "",
      role: user.role ?? "user",
    });
  };

  const closeDialogs = () => {
    setIsCreateOpen(false);
    setEditingUser(null);
    setFormState(emptyForm);
  };

  const buildPayload = (state: UserFormState) => ({
    name: state.name.trim() || undefined,
    email: state.email.trim() || undefined,
    phone: state.phone.trim() || undefined,
    image: state.image.trim() || undefined,
    role: state.role.trim() || "user",
  });

  const isFormEmpty =
    !formState.name && !formState.email && !formState.phone && !formState.image;

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    await createUser(buildPayload(formState));
    setIsSaving(false);
    closeDialogs();
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) {
      return;
    }
    setIsSaving(true);
    await updateUser({
      userId: editingUser._id,
      ...buildPayload(formState),
    });
    setIsSaving(false);
    closeDialogs();
  };

  const handleToggleStatus = async (user: UserRow) => {
    if (user.isDeactivated) {
      await reactivateUser({ userId: user._id });
    } else {
      await deactivateUser({ userId: user._id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">User management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review accounts and manage permissions.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md transition"
        >
          <Plus className="h-4 w-4" />
          New user
        </button>
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
            {activeCount} active accounts
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
              Deactivated
            </p>
            <span className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 flex items-center justify-center">
              <UserX className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-semibold mt-2">
            {users.length - activeCount}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Disabled accounts
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
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id}
                  className={`border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${
                    user.isDeactivated ? "opacity-70" : ""
                  }`}
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
                    {user.isDeactivated
                      ? "Deactivated"
                      : user.isAnonymous
                        ? "Anonymous"
                        : "Active"}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {new Date(user._creationTime).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => void handleToggleStatus(user)}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                          user.isDeactivated
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
                        }`}
                      >
                        <UserCheck className="h-3 w-3" />
                        {user.isDeactivated ? "Activate" : "Deactivate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">Phone</Label>
              <Input
                id="create-phone"
                value={formState.phone}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-image">Avatar URL</Label>
              <Input
                id="create-image"
                value={formState.image}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    image: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={formState.role}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger id="create-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={closeDialogs}
                className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isFormEmpty}
                className="rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Create"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingUser)} onOpenChange={closeDialogs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formState.phone}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">Avatar URL</Label>
              <Input
                id="edit-image"
                value={formState.image}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    image: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formState.role}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={closeDialogs}
                className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
