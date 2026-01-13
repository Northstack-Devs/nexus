# Agent Notes

## Project Overview

- Nexus is a Next.js dashboard starter backed by Convex and Convex Auth.
- Admin dashboard overview lives under `app/(admin)/admin` with layout in `app/(admin)/layout.tsx`.
- `/` redirects to `/admin` when authenticated, otherwise `/signin`.

## Recent Changes

- Modernized auth UI and added `/signup` route alongside `/signin`.
- Added password reset flow (logs reset link from `convex/auth.ts`).
- Added username availability checks via `convex/myFunctions.ts`.
- Admin dashboard shell includes user management, roles, subscriptions, and audit logs.

## Auth & Roles

- Roles are stored on `users.role` (string, optional).
- Admin gating currently happens in `convex/admin.ts` and UI.
- There is no automatic bootstrap; roles are set manually via mutation or DB updates.

## Useful Commands

- Regenerate bindings / apply schema: `npx convex dev --once`
- Dev: `npm run dev`
- Lint: `npm run lint`
