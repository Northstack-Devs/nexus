import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

async function requireAdmin(ctx: { db: any; auth: any }) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new Error("Not authenticated");
  }

  const user = await ctx.db.get("users", userId);
  if (!user || user.role !== "admin") {
    throw new Error("Not authorized");
  }

  return user;
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const user = await ctx.db.get("users", userId);
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      email: user.email ?? null,
      name: user.name ?? null,
      role: user.role ?? "user",
      image: user.image ?? null,
    };
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const viewer = await ctx.db.get("users", userId);
    if (!viewer || viewer.role !== "admin") {
      return [];
    }

    const users = await ctx.db.query("users").order("desc").take(50);
    return users.map((user) => ({
      _id: user._id,
      email: user.email ?? null,
      name: user.name ?? null,
      phone: user.phone ?? null,
      role: user.role ?? "user",
      image: user.image ?? null,
      isAnonymous: user.isAnonymous ?? false,
      isDeactivated: user.isDeactivated ?? false,
      _creationTime: user._creationTime,
    }));
  },
});

export const listRoles = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("roles").order("desc").take(100);
  },
});

export const createRole = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    return await ctx.db.insert("roles", {
      name: args.name,
      description: args.description,
      permissions: args.permissions,
    });
  },
});

export const updateRole = mutation({
  args: {
    roleId: v.id("roles"),
    name: v.string(),
    description: v.optional(v.string()),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.roleId, {
      name: args.name,
      description: args.description,
      permissions: args.permissions,
    });
  },
});

export const deleteRole = mutation({
  args: {
    roleId: v.id("roles"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.roleId);
  },
});

export const createUser = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    return await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      image: args.image,
      role: args.role ?? "user",
      isDeactivated: false,
    });
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.userId, {
      name: args.name,
      email: args.email,
      phone: args.phone,
      image: args.image,
      role: args.role ?? "user",
    });
  },
});

export const deactivateUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, {
      isDeactivated: true,
    });
  },
});

export const reactivateUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, {
      isDeactivated: false,
    });
  },
});

export const seedRolePresets = internalMutation({
  args: {},
  handler: async (ctx) => {
    const presets = [
      {
        name: "admin",
        description: "Full access to manage users, roles, and settings.",
        permissions: [
          "users.read",
          "users.write",
          "roles.manage",
          "audit.read",
          "settings.manage",
        ],
      },
      {
        name: "manager",
        description: "Manage users and review audit logs.",
        permissions: ["users.read", "users.write", "audit.read"],
      },
      {
        name: "support",
        description: "Read-only access to users and audit logs.",
        permissions: ["users.read", "audit.read"],
      },
      {
        name: "analyst",
        description: "View users and system analytics.",
        permissions: ["users.read"],
      },
    ];

    for (const preset of presets) {
      const existing = await ctx.db
        .query("roles")
        .withIndex("name", (q) => q.eq("name", preset.name))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, preset);
      } else {
        await ctx.db.insert("roles", preset);
      }
    }
  },
});

export const setUserRole = internalMutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      role: args.role,
    });
  },
});
