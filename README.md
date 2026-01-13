# Nexus Admin Dashboard Starter

Nexus is a Next.js admin dashboard starter backed by Convex, Convex Auth, and a set of frontend UI libraries. It ships with a modern admin shell, user management workflows, role presets, and authentication screens ready to customize.

## Routes

- `/signin`: primary sign-in page.
- `/signup`: sign-up page with password strength and username checks.
- `/admin`: admin dashboard and management tools.
- `/`: auto-redirects to `/admin` when authenticated, otherwise `/signin`.

## Getting started

```bash
npm install
npx convex dev --once
npm run dev
```

## Admin access

Roles are stored on `users.role`. Update the user document (or use the admin mutations) to set `role = "admin"` for the initial admin account.

## Convex Auth

- Password reset is enabled but currently logs the reset link in `convex/auth.ts`. Replace the email provider with your real email service before going live.
- Auth screens live in `app/signin/page.tsx` and `app/signup/page.tsx`.

## Learn more

- Convex docs: https://docs.convex.dev/
- Convex Auth docs: https://labs.convex.dev/auth
- Overview notes: `docs/overview.md`
