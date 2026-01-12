# Product Overview

## Summary

Upty is a Next.js application backed by Convex and Convex Auth. The admin experience lives in the `(admin)` route group and is intended to evolve into a full management console for the product.

## Core Features

- Authentication via Convex Auth with session handling and protected routes.
- Admin dashboard UI with sidebar + topbar shell.
- User management with role-based gating and CRUD workflows.
- Account deactivation using a soft-delete flag (`users.isDeactivated`).

## Admin Dashboard

- Route: `/admin` (`app/(admin)/admin`)
- Gating: authenticated users with `users.role === "admin"`.
- User management actions: create, edit, deactivate/reactivate.
- Roles & permissions: `/admin/roles` with role presets (admin, author, user) and permission editing.

## Data Model

- `users`
  - `role` (optional string)
  - `isDeactivated` (optional boolean)
  - Standard Convex Auth fields (email, name, phone, image, etc.)

## Convex Admin Functions

- Queries
  - `getCurrentUser`
  - `listUsers` (admin-only results)
  - `listRoles` (admin-only results)
- Mutations
  - `createUser`
  - `updateUser`
  - `deactivateUser`
  - `reactivateUser`
  - `createRole`
  - `updateRole`
  - `deleteRole`
  - `seedRolePresets` (internal, admin/author/user presets)
  - `setUserRole` (internal)

## Roadmap Ideas

- Public dashboard route and analytics widgets.
- Role-based access control (RBAC) definitions.
- Audit logs and activity history.
- Admin notifications and system status panels.
