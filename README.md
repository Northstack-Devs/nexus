# Nexus Admin Dashboard Starter

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)
![Convex](https://img.shields.io/badge/Convex-4B32C3?logo=convex&logoColor=white)
![Resend](https://img.shields.io/badge/Resend-000000?logo=resend&logoColor=white)

Nexus is a Next.js admin dashboard starter backed by Convex, Convex Auth, and a set of frontend UI libraries. It ships with a modern admin shell, user management workflows, role presets, and authentication screens ready to customize.

## Routes

- `/signin`: primary sign-in page.
- `/signup`: sign-up page with password strength and username checks.
- `/admin`: admin dashboard and management tools.
- `/credits`: acknowledgements and GitHub link.
- `/`: redirects admins to `/admin`, otherwise shows a pending-access landing page.

## Getting started

```bash
npm install
npx convex dev --once
npm run seed:roles
npm run dev
```

During `npm install` you'll be prompted to choose whether you want to use a
self-hosted Convex instance. If you answer yes, the setup script will update
`.env.local` with your self-hosted URL and admin key and skip the Convex Auth
setup.

## JWT keys

Generate the signing keys and add them to your Convex environment:

```bash
node generateKeys.mjs
```

The script prints `JWT_PRIVATE_KEY` and `JWKS`. Copy each value into Convex:

```bash
npx convex env set JWT_PRIVATE_KEY "<value-from-output>"
npx convex env set JWKS '<value-from-output>'
```

## Admin access

Roles are stored on `users.role`. The first user created becomes an admin automatically; update the user document (or use the admin mutations) to change roles later.

## Convex Auth

- Supported email provider: Resend.
- Password reset and welcome emails are sent via Resend when configured.
- Update email templates and API keys in the Admin Settings > Email tab.
- Auth screens live in `app/signin/page.tsx` and `app/signup/page.tsx`.

## Learn more

- Convex docs: https://docs.convex.dev/
- Convex Auth docs: https://labs.convex.dev/auth
- Overview notes: `docs/overview.md`
