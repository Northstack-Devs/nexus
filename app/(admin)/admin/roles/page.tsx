"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface RoleRow {
  _id: Id<"roles">;
  name: string;
  description?: string;
  permissions: string[];
  _creationTime: number;
}

interface UserRow {
  _id: Id<"users">;
  name: string | null;
  email: string | null;
  role: string | null;
  isDeactivated: boolean;
}

interface RoleDisplay {
  _id?: Id<"roles">;
  name: string;
  description?: string;
  permissions: string[];
  assignedUsers: UserRow[];
}

interface RoleFormState {
  name: string;
  description: string;
  permissions: string[];
}

const PERMISSIONS = [
  {
    id: "users.read",
    label: "Read users",
    description: "View user profiles and metadata",
  },
  {
    id: "users.write",
    label: "Manage users",
    description: "Create, edit, deactivate users",
  },
  {
    id: "roles.manage",
    label: "Manage roles",
    description: "Create and update role definitions",
  },
  {
    id: "audit.read",
    label: "Read audit logs",
    description: "View administrative activity",
  },
  {
    id: "subscriptions.read",
    label: "Read subscriptions",
    description: "View subscription status and plan details",
  },
  {
    id: "subscriptions.manage",
    label: "Manage subscriptions",
    description: "Create and update subscriptions",
  },
  {
    id: "billing.manage",
    label: "Manage billing",
    description: "Handle billing operations and invoices",
  },
  {
    id: "settings.manage",
    label: "Manage settings",
    description: "Update system configuration",
  },
];

const emptyRole: RoleFormState = {
  name: "",
  description: "",
  permissions: [],
};

export default function RolesPage() {
  const currentUser = useQuery(api.admin.getCurrentUser, {});
  const roles = useQuery(
    api.admin.listRoles,
    currentUser?.role === "admin" ? {} : "skip",
  ) as RoleRow[] | undefined;
  const users = useQuery(
    api.admin.listUsers,
    currentUser?.role === "admin" ? {} : "skip",
  ) as UserRow[] | undefined;

  const createRole = useMutation(api.admin.createRole);
  const updateRole = useMutation(api.admin.updateRole);
  const deleteRole = useMutation(api.admin.deleteRole);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDisplay | null>(null);
  const [formState, setFormState] = useState<RoleFormState>(emptyRole);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRoleName, setSelectedRoleName] = useState("");

  const roleSummaries = useMemo(() => {
    const baseRoles = roles ?? [];
    const userList = users ?? [];
    const roleMap = new Map<string, RoleDisplay>();

    baseRoles.forEach((role) => {
      roleMap.set(role.name, {
        _id: role._id,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        assignedUsers: [],
      });
    });

    userList.forEach((user) => {
      const roleName = user.role ?? "user";
      if (!roleMap.has(roleName)) {
        roleMap.set(roleName, {
          name: roleName,
          permissions: [],
          assignedUsers: [],
        });
      }
      roleMap.get(roleName)?.assignedUsers.push(user);
    });

    return Array.from(roleMap.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [roles, users]);

  const roleCount = useMemo(() => roleSummaries.length, [roleSummaries]);

  useEffect(() => {
    if (roleSummaries.length === 0) {
      setSelectedRoleName("");
      return;
    }
    if (!selectedRoleName) {
      setSelectedRoleName(roleSummaries[0].name);
      return;
    }
    const hasRole = roleSummaries.some(
      (role) => role.name === selectedRoleName,
    );
    if (!hasRole) {
      setSelectedRoleName(roleSummaries[0].name);
    }
  }, [roleSummaries, selectedRoleName]);

  const selectedRole = useMemo(
    () => roleSummaries.find((role) => role.name === selectedRoleName) ?? null,
    [roleSummaries, selectedRoleName],
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

  if (roles === undefined || users === undefined) {
    return (
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Loading roles...
      </div>
    );
  }

  const openCreate = (roleName?: string) => {
    setEditingRole(null);
    setFormState({
      ...emptyRole,
      name: roleName ?? "",
    });
    setIsDialogOpen(true);
  };

  const openEdit = (role: RoleDisplay) => {
    setEditingRole(role);
    setFormState({
      name: role.name ?? "",
      description: role.description ?? "",
      permissions: role.permissions ?? [],
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRole(null);
    setFormState(emptyRole);
  };

  const togglePermission = (permissionId: string) => {
    setFormState((prev) => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions };
    });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      permissions: formState.permissions,
    };

    if (editingRole?._id) {
      await updateRole({ roleId: editingRole._id, ...payload });
    } else {
      await createRole(payload);
    }

    setIsSaving(false);
    closeDialog();
  };

  const handleDelete = async (role: RoleDisplay) => {
    if (!role._id) {
      return;
    }
    const confirmed = window.confirm(
      `Delete the ${role.name} role? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    await deleteRole({ roleId: role._id });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Roles & permissions</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define role access for admin experiences.
          </p>
        </div>
        <button
          onClick={() => openCreate()}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 text-sm font-semibold shadow-sm hover:shadow-md transition"
        >
          <Plus className="h-4 w-4" />
          New role
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total roles
              </p>
              <p className="text-2xl font-semibold">{roleCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold">Role details</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a role to manage its permissions and assignments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openCreate()}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition"
            >
              <Plus className="h-3 w-3" />
              New role
            </button>
            <button
              onClick={() => selectedRole && openEdit(selectedRole)}
              disabled={!selectedRole?._id}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
            <button
              onClick={() => selectedRole && void handleDelete(selectedRole)}
              disabled={!selectedRole?._id}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>

        {roleSummaries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-500 dark:text-slate-400">
            No roles defined yet. Create your first role to get started.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={selectedRoleName}
                  onValueChange={setSelectedRoleName}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleSummaries.map((role) => (
                      <SelectItem key={role.name} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Description
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {selectedRole?.description || "No description set."}
                </p>
                {!selectedRole?._id && selectedRole && (
                  <button
                    onClick={() => openCreate(selectedRole.name)}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Create role definition
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Permissions</p>
                <button
                  onClick={() => selectedRole && openEdit(selectedRole)}
                  disabled={!selectedRole?._id}
                  className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >
                  Edit permissions
                </button>
              </div>
              <div className="space-y-2">
                {PERMISSIONS.map((permission) => {
                  const isEnabled = Boolean(
                    selectedRole?.permissions.includes(permission.id),
                  );
                  return (
                    <div
                      key={permission.id}
                      className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3"
                    >
                      <Checkbox checked={isEnabled} disabled />
                      <span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {permission.label}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {permission.description}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
          <p className="text-sm font-semibold">Assigned users</p>
          <div className="flex flex-wrap gap-2">
            {selectedRole?.assignedUsers.length ? (
              selectedRole.assignedUsers.map((user) => (
                <span
                  key={user._id}
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    user.isDeactivated
                      ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-200"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {user.name ?? user.email ?? user._id}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                No users assigned to this role yet.
              </span>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit role" : "Create role"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role name</Label>
              <Input
                id="role-name"
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
              <Label htmlFor="role-description">Description</Label>
              <Input
                id="role-description"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-800 p-3">
                {PERMISSIONS.map((permission) => (
                  <label
                    key={permission.id}
                    className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-200"
                  >
                    <Checkbox
                      checked={formState.permissions.includes(permission.id)}
                      onCheckedChange={() => togglePermission(permission.id)}
                    />
                    <span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {permission.label}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        {permission.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || formState.name.trim().length === 0}
                className="rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-3 py-2 text-xs font-semibold hover:bg-slate-700 dark:hover:bg-slate-200 transition disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save role"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
