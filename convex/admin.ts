import { query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

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
      role: user.role ?? "user",
      image: user.image ?? null,
      isAnonymous: user.isAnonymous ?? false,
      _creationTime: user._creationTime,
    }));
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
