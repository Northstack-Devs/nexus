# Agent Notes

## Project Overview

- Next.js app with Convex backend and Convex Auth.
- Admin dashboard lives under `app/(admin)/admin` with layout in `app/(admin)/layout.tsx`.

## Recent Changes

- Added admin dashboard shell with modern styling and user management UI.
- Extended `users` table with optional `role` and `isDeactivated` fields in `convex/schema.ts`.
- Added admin queries and mutations in `convex/admin.ts` for user CRUD and role management.
- Seeded role presets via `seedRolePresets` internal mutation.
- `/admin` is protected in `middleware.ts` (requires authentication).
- Added feature overview documentation in `docs/overview.md`.

## Auth & Roles

- Roles are stored on `users.role` (string, optional).
- Admin gating currently happens in `convex/admin.ts` and UI.
- There is no automatic bootstrap; roles are set manually via mutation or DB updates.

## Useful Commands

- Regenerate bindings / apply schema: `npx convex dev --once`
- Dev: `npm run dev`
- Lint: `npm run lint`
