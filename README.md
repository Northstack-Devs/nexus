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

During `npm install` the setup script runs automatically. It will:

1. Ask whether you want to use a **self-hosted** Convex instance.
2. For self-hosted, prompt for the **Deployment URL**, **HTTP Actions URL**, **Dashboard URL**, and **Admin Key**.
3. Generate `JWT_PRIVATE_KEY` and `JWKS` keys automatically.
4. Push `SITE_URL`, `JWT_PRIVATE_KEY`, and `JWKS` to your Convex deployment via `npx convex env set`.

If the env vars are already configured, the script will let you know and ask before overwriting.

### Re-running setup

You can re-run the full interactive setup at any time:

```bash
npm run setup
```

### Manual key generation

If you prefer to generate keys manually:

```bash
node generateKeys.mjs
```

Then set them on your Convex deployment:

```bash
npx convex env set SITE_URL "<your-http-actions-url>"
npx convex env set JWT_PRIVATE_KEY "<value-from-output>"
npx convex env set JWKS '<value-from-output>'
```

## Self-hosted Convex

When using a self-hosted Convex instance (e.g. NorthStack), the setup script stores three separate URLs in `.env.local`:

| Variable | Purpose |
|---|---|
| `CONVEX_SELF_HOSTED_URL` | Deployment endpoint (backend) |
| `CONVEX_SELF_HOSTED_HTTP_URL` | HTTP actions endpoint (auth routes) |
| `CONVEX_DASHBOARD_URL` | Dashboard web UI |

The HTTP actions URL is also exposed as `NEXT_PUBLIC_CONVEX_HTTP_URL` so the frontend can build correct OAuth callback URLs without relying on the cloud `.convex.site` convention.

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
