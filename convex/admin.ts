import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
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

    let imageUrl: string | null = null;
    if (user.image) {
      if (typeof user.image === "string" && user.image.startsWith("http")) {
        imageUrl = user.image;
      } else {
        imageUrl = await ctx.storage.getUrl(user.image as Id<"_storage">);
      }
    }

    return {
      _id: user._id,
      email: user.email ?? null,
      name: user.name ?? null,
      phone: user.phone ?? null,
      role: user.role ?? "user",
      image: user.image ?? null,
      imageUrl,
    };
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

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

export const listSubscriptionPlans = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    let query = ctx.db.query("subscriptionPlans").order("desc");
    if (args.search) {
      const term = args.search.trim();
      query = query.filter((q) =>
        q.or(q.eq(q.field("name"), term), q.eq(q.field("description"), term)),
      );
    }
    if (typeof args.isActive === "boolean") {
      query = query.filter((q) => q.eq(q.field("isActive"), args.isActive));
    }

    return await query.paginate(args.paginationOpts);
  },
});

export const createSubscriptionPlan = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    priceMonthly: v.optional(v.number()),
    priceYearly: v.optional(v.number()),
    features: v.array(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const planId = await ctx.db.insert("subscriptionPlans", {
      name: args.name,
      description: args.description,
      priceMonthly: args.priceMonthly,
      priceYearly: args.priceYearly,
      features: args.features,
      isActive: args.isActive ?? true,
    });

    await logAudit(ctx, "plan.created", planId, {
      name: args.name,
    });

    return planId;
  },
});

export const updateSubscriptionPlan = mutation({
  args: {
    planId: v.id("subscriptionPlans"),
    name: v.string(),
    description: v.optional(v.string()),
    priceMonthly: v.optional(v.number()),
    priceYearly: v.optional(v.number()),
    features: v.array(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    await ctx.db.patch(args.planId, {
      name: args.name,
      description: args.description,
      priceMonthly: args.priceMonthly,
      priceYearly: args.priceYearly,
      features: args.features,
      isActive: args.isActive,
    });

    await logAudit(ctx, "plan.updated", args.planId, {
      name: args.name,
    });
  },
});

export const deleteSubscriptionPlan = mutation({
  args: {
    planId: v.id("subscriptionPlans"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.planId);

    await logAudit(ctx, "plan.deleted", args.planId);
  },
});

export const listSubscriptions = query({
  args: {
    paginationOpts: paginationOptsValidator,
    userId: v.optional(v.id("users")),
    planId: v.optional(v.id("subscriptionPlans")),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let query = ctx.db.query("subscriptions").order("desc");
    if (args.userId) {
      query = query.filter((q) => q.eq(q.field("userId"), args.userId));
    }
    if (args.planId) {
      query = query.filter((q) => q.eq(q.field("planId"), args.planId));
    }
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    return await query.paginate(args.paginationOpts);
  },
});

export const createSubscription = mutation({
  args: {
    userId: v.id("users"),
    planId: v.optional(v.id("subscriptionPlans")),
    status: v.string(),
    currentPeriodEnd: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const subscriptionId = await ctx.db.insert("subscriptions", {
      userId: args.userId,
      planId: args.planId,
      status: args.status,
      currentPeriodEnd: args.currentPeriodEnd,
      metadata: args.metadata,
    });

    await logAudit(ctx, "subscription.created", subscriptionId, {
      userId: args.userId,
      planId: args.planId ?? null,
      status: args.status,
    });

    return subscriptionId;
  },
});

export const updateSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    planId: v.optional(v.id("subscriptionPlans")),
    status: v.optional(v.string()),
    currentPeriodEnd: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const updates = {
      planId: args.planId,
      status: args.status,
      currentPeriodEnd: args.currentPeriodEnd,
      canceledAt: args.canceledAt,
      metadata: args.metadata,
    };

    await ctx.db.patch(args.subscriptionId, updates);

    await logAudit(ctx, "subscription.updated", args.subscriptionId, {
      planId: args.planId ?? null,
      status: args.status ?? null,
    });
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

    const updates: any = {
      name: args.name,
      email: args.email,
      phone: args.phone,
      image: args.image,
    };
    if (args.role !== undefined) {
      updates.role = args.role;
    }

    await ctx.db.patch(args.userId, updates);

    await logAudit(ctx, "user.updated", args.userId, {
      email: args.email ?? null,
      role: args.role,
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
          "subscriptions.read",
          "subscriptions.manage",
          "billing.manage",
          "settings.manage",
        ],
      },
      {
        name: "author",
        description: "Create and maintain content with limited access.",
        permissions: ["users.read", "subscriptions.read"],
      },
      {
        name: "user",
        description: "Default access with minimal administrative permissions.",
        permissions: ["subscriptions.read"],
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

const normalizeOptional = (value?: string) => {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const getEmailSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const settings = await ctx.db.query("emailSettings").first();
    return {
      provider: settings?.provider ?? "resend",
      resendApiKeySet: Boolean(settings?.resendApiKey),
      from: settings?.from ?? null,
      replyTo: settings?.replyTo ?? null,
      resetSubject: settings?.resetSubject ?? null,
      resetHtml: settings?.resetHtml ?? null,
      welcomeSubject: settings?.welcomeSubject ?? null,
      welcomeHtml: settings?.welcomeHtml ?? null,
      updatedAt: settings?.updatedAt ?? null,
    };
  },
});

export const updateEmailSettings = mutation({
  args: {
    provider: v.optional(v.string()),
    resendApiKey: v.optional(v.string()),
    from: v.optional(v.string()),
    replyTo: v.optional(v.string()),
    resetSubject: v.optional(v.string()),
    resetHtml: v.optional(v.string()),
    welcomeSubject: v.optional(v.string()),
    welcomeHtml: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const settings = await ctx.db.query("emailSettings").first();
    const nextFrom =
      args.from !== undefined ? normalizeOptional(args.from) : settings?.from;
    const nextReplyTo =
      args.replyTo !== undefined
        ? normalizeOptional(args.replyTo)
        : settings?.replyTo;
    const nextResendApiKey =
      args.resendApiKey !== undefined
        ? normalizeOptional(args.resendApiKey)
        : settings?.resendApiKey;
    const nextResetSubject =
      args.resetSubject !== undefined
        ? normalizeOptional(args.resetSubject)
        : settings?.resetSubject;
    const nextResetHtml =
      args.resetHtml !== undefined
        ? normalizeOptional(args.resetHtml)
        : settings?.resetHtml;
    const nextWelcomeSubject =
      args.welcomeSubject !== undefined
        ? normalizeOptional(args.welcomeSubject)
        : settings?.welcomeSubject;
    const nextWelcomeHtml =
      args.welcomeHtml !== undefined
        ? normalizeOptional(args.welcomeHtml)
        : settings?.welcomeHtml;

    const payload = {
      provider: args.provider ?? settings?.provider ?? "resend",
      resendApiKey: nextResendApiKey,
      from: nextFrom,
      replyTo: nextReplyTo,
      resetSubject: nextResetSubject,
      resetHtml: nextResetHtml,
      welcomeSubject: nextWelcomeSubject,
      welcomeHtml: nextWelcomeHtml,
      updatedAt: Date.now(),
    };

    if (settings) {
      await ctx.db.patch(settings._id, payload);
      return settings._id;
    }

    return await ctx.db.insert("emailSettings", payload);
  },
});

export const updateMyProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(userId, {
      name: args.name,
      email: args.email,
      phone: args.phone,
    });
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

export const generateAvatarUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const updateAvatar = mutation({
  args: {
    storageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(userId, {
      image: args.storageId ?? undefined,
    });
  },
});
