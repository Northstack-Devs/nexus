import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
const users = defineTable({
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),
  role: v.optional(v.string()),
  isDeactivated: v.optional(v.boolean()),
})
  .index("email", ["email"])
  .index("phone", ["phone"]);

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

export default defineSchema({
  ...authTables,
  users,
  roles,
  auditLogs,
  numbers: defineTable({
    value: v.number(),
  }),
});
