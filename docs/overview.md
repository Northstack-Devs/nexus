# Product Overview

## Summary

Upty is a Next.js + Convex dashboard template with Convex Auth. The admin experience lives in the `(admin)` route group and is intended as a starting point for internal tooling or SaaS dashboards.

## Routing

- `/` redirects to `/admin` when authenticated, otherwise `/signin`.
- `/signin` and `/signup` provide password-based auth flows.
- `/admin` is the primary dashboard entry point.

## Core Features

- Authentication via Convex Auth with session handling and protected routes.
- Admin dashboard UI with sidebar + topbar shell.
- User management with role-based gating and CRUD workflows.
- Account deactivation using a soft-delete flag (`users.isDeactivated`).
- Subscription plans and user subscriptions for feature access.

## Admin Dashboard

- Route: `/admin` (`app/(admin)/admin`) for overview.
- Gating: authenticated users with `users.role === "admin"`.
- User management: `/admin/users` for create, edit, deactivate/reactivate.
- Roles & permissions: `/admin/roles` with role presets (admin, author, user) and permission editing.
- Audit logs: `/admin/logs` streaming admin activity.

## Data Model

- `users`
  - `role` (optional string)
  - `isDeactivated` (optional boolean)
  - Standard Convex Auth fields (email, name, phone, image, etc.)
- `auditLogs`
  - `action` (string)
  - `actorId` (optional users id)
  - `actorName` / `actorEmail` (optional)
  - `metadata` (optional payload)
- `subscriptionPlans`
  - `name`, `description`
  - `priceMonthly`, `priceYearly`
  - `features`, `isActive`
- `subscriptions`
  - `userId`, `planId`, `status`
  - `currentPeriodEnd`, `canceledAt`, `metadata`

## Convex Admin Functions

- Queries
  - `getCurrentUser`
  - `listUsers` (admin-only results)
  - `listRoles` (admin-only results)
  - `listSubscriptionPlans` (admin-only results)
  - `listSubscriptions` (admin-only results)
- Mutations
  - `createUser`
  - `updateUser`
  - `deactivateUser`
  - `reactivateUser`
  - `createRole`
  - `updateRole`
  - `deleteRole`
  - `createSubscriptionPlan`
  - `updateSubscriptionPlan`
  - `deleteSubscriptionPlan`
  - `createSubscription`
  - `updateSubscription`
  - `seedRolePresets` (internal, admin/author/user presets)
  - `setUserRole` (internal)
- Audit
  - `listAuditLogs`

## Roadmap Ideas

- Role-based access control (RBAC) definitions.
- Admin notifications and system status panels.
- Organization or team support for multi-tenant dashboards.
