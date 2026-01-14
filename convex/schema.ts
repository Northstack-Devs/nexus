import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
const users = defineTable({
  name: v.optional(v.string()),
  image: v.optional(v.union(v.string(), v.id("_storage"))),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  role: v.optional(v.string()),
  isDeactivated: v.optional(v.boolean()),
})
  .index("email", ["email"])
  .index("phone", ["phone"])
  .index("name", ["name"]);

const roles = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  permissions: v.array(v.string()),
}).index("name", ["name"]);

const auditLogs = defineTable({
  action: v.string(),
  actorId: v.optional(v.id("users")),
  actorName: v.optional(v.string()),
  actorEmail: v.optional(v.string()),
  targetId: v.optional(v.string()),
  metadata: v.optional(v.any()),
})
  .index("action", ["action"])
  .index("actorId", ["actorId"]);

const subscriptionPlans = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  priceMonthly: v.optional(v.number()),
  priceYearly: v.optional(v.number()),
  features: v.array(v.string()),
  isActive: v.optional(v.boolean()),
}).index("name", ["name"]);

const subscriptions = defineTable({
  userId: v.id("users"),
  planId: v.optional(v.id("subscriptionPlans")),
  status: v.string(),
  currentPeriodEnd: v.optional(v.number()),
  canceledAt: v.optional(v.number()),
  metadata: v.optional(v.any()),
})
  .index("userId", ["userId"])
  .index("planId", ["planId"])
  .index("status", ["status"]);

const rateLimits = defineTable({
  key: v.string(),
  count: v.number(),
  windowStart: v.number(),
}).index("key", ["key"]);

const emailSettings = defineTable({
  provider: v.string(),
  resendApiKey: v.optional(v.string()),
  from: v.optional(v.string()),
  replyTo: v.optional(v.string()),
  resetSubject: v.optional(v.string()),
  resetHtml: v.optional(v.string()),
  welcomeSubject: v.optional(v.string()),
  welcomeHtml: v.optional(v.string()),
  updatedAt: v.number(),
});

const oauthSettings = defineTable({
  provider: v.string(),
  enabled: v.boolean(),
  updatedAt: v.number(),
}).index("provider", ["provider"]);

export default defineSchema({
  ...authTables,
  users,
  roles,
  auditLogs,
  subscriptionPlans,
  subscriptions,
  rateLimits,
  emailSettings,
  oauthSettings,
  numbers: defineTable({
    value: v.number(),
  }),
});
