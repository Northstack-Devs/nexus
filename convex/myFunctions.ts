import { v } from "convex/values";
import { query } from "./_generated/server";

export const checkUsernameAvailability = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const normalized = args.username.trim().toLowerCase();
    if (normalized.length < 3) {
      return false;
    }
    const existing = await ctx.db
      .query("users")
      .withIndex("name", (query) => query.eq("name", normalized))
      .first();
    return existing === null;
  },
});
