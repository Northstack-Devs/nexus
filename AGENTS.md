# Agent Notes

## Project Overview

- Next.js app with Convex backend and Convex Auth.
- Admin dashboard lives under `app/(admin)/dashboard` with layout in `app/(admin)/layout.tsx`.

## Recent Changes

- Added admin dashboard shell and user management UI (sidebar + topbar layout).
- Extended `users` table with optional `role` field in `convex/schema.ts`.
- Added admin queries in `convex/admin.ts`: `getCurrentUser`, `listUsers`, and internal mutation `setUserRole`.
- `/dashboard` is protected in `middleware.ts` (requires authentication).

## Auth & Roles

- Roles are stored on `users.role` (string, optional).
- Admin gating currently happens in `convex/admin.ts` and UI.
- There is no automatic bootstrap; roles are set manually via mutation or DB updates.

## Useful Commands

- Regenerate bindings / apply schema: `npx convex dev --once`
- Dev: `npm run dev`
- Lint: `npm run lint`
