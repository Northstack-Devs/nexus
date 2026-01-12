import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

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

async function logAudit(
  ctx: { db: any; auth: any },
  action: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  const userId = await getAuthUserId(ctx);
  let actorName: string | undefined;
  let actorEmail: string | undefined;

  if (userId) {
    const actor = await ctx.db.get("users", userId);
    actorName = actor?.name ?? undefined;
    actorEmail = actor?.email ?? undefined;
  }

  await ctx.db.insert("auditLogs", {
    action,
    actorId: userId ?? undefined,
    actorName,
    actorEmail,
    targetId,
    metadata,
  });
}

export const listAuditLogs = query({
  args: {
    paginationOpts: paginationOptsValidator,
    action: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let query = ctx.db.query("auditLogs").order("desc");

    if (args.action) {
      query = query.filter((q) => q.eq(q.field("action"), args.action));
    }
    if (typeof args.startTime === "number") {
      const startTime = args.startTime;
      query = query.filter((q) => q.gte(q.field("_creationTime"), startTime));
    }
    if (typeof args.endTime === "number") {
      const endTime = args.endTime;
      query = query.filter((q) => q.lte(q.field("_creationTime"), endTime));
    }

    return await query.paginate(args.paginationOpts);
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

    const roleId = await ctx.db.insert("roles", {
      name: args.name,
      description: args.description,
      permissions: args.permissions,
    });

    await logAudit(ctx, "role.created", roleId, {
      name: args.name,
    });

    return roleId;
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

    await logAudit(ctx, "role.updated", args.roleId, {
      name: args.name,
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

    await logAudit(ctx, "role.deleted", args.roleId);
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

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      image: args.image,
      role: args.role ?? "user",
      isDeactivated: false,
    });

    await logAudit(ctx, "user.created", userId, {
      email: args.email ?? null,
      role: args.role ?? "user",
    });

    return userId;
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

    await logAudit(ctx, "user.updated", args.userId, {
      email: args.email ?? null,
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

    await logAudit(ctx, "user.deactivated", args.userId);
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

    await logAudit(ctx, "user.reactivated", args.userId);
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
        name: "author",
        description: "Create and maintain content with limited access.",
        permissions: ["users.read"],
      },
      {
        name: "user",
        description: "Default access with minimal administrative permissions.",
        permissions: [],
      },
    ];

    const allowedNames = new Set(presets.map((preset) => preset.name));

    for (const preset of presets) {
      const existing = await ctx.db
        .query("roles")
        .withIndex("name", (q) => q.eq("name", preset.name))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, preset);
        await logAudit(ctx, "role.updated", existing._id, {
          name: preset.name,
        });
      } else {
        const roleId = await ctx.db.insert("roles", preset);
        await logAudit(ctx, "role.created", roleId, {
          name: preset.name,
        });
      }
    }

    const existingRoles = await ctx.db.query("roles").collect();
    for (const role of existingRoles) {
      if (!allowedNames.has(role.name)) {
        await ctx.db.delete(role._id);
        await logAudit(ctx, "role.deleted", role._id, {
          reason: "seed_reset",
        });
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
