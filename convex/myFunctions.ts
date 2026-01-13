import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

async function enforceRateLimit(ctx: any, key: string) {
  const now = Date.now();
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("key", (query: any) => query.eq("key", key))
    .first();

  if (!existing) {
    await ctx.db.insert("rateLimits", {
      key,
      count: 1,
      windowStart: now,
    });
    return;
  }

  if (now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    await ctx.db.patch(existing._id, {
      count: 1,
      windowStart: now,
    });
    return;
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    throw new Error("Rate limit exceeded. Try again soon.");
  }

  await ctx.db.patch(existing._id, {
    count: existing.count + 1,
  });
}

export const checkUsernameAvailability = mutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.username.trim().toLowerCase();
    if (normalized.length < 3) {
      return false;
    }

    const userId = await getAuthUserId(ctx);
    const rateLimitKey = userId ? `user:${userId}` : `anon:${normalized}`;
    await enforceRateLimit(ctx, rateLimitKey);

    const existing = await ctx.db
      .query("users")
      .withIndex("name", (query) => query.eq("name", normalized))
      .first();
    return existing === null;
  },
});
