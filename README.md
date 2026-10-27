# 🏺 Gốm Sứ Xanh

An e-commerce platform for handmade ceramics and pottery workshop bookings. This monorepo contains three apps:

| App           | Stack                                                                      | Dev URL                                    |
| ------------- | -------------------------------------------------------------------------- | ------------------------------------------ |
| `apps/server` | Node.js, Express 5, TypeScript, TypeORM, PostgreSQL (Supabase), Zod, JWT   | http://localhost:8080 (Swagger at `/docs`) |
| `apps/client` | React 19, Vite, TypeScript, Tailwind CSS 4, Zustand, React Hook Form + Zod | http://localhost:3000                      |
| `apps/admin`  | Same stack as client, admin dashboard                                      | http://localhost:3001                      |

The code layout follows [ts-backend](https://github.com/wangnguen/ts-backend) and [ts-frontend](https://github.com/wangnguen/ts-frontend).

## Current scope — E1. Account authentication

| User story                                 | Server | Client                                | Admin                      |
| ------------------------------------------ | ------ | ------------------------------------- | -------------------------- |
| US-01 Sign up (email verification via OTP) | ✅     | `/register`, `/verify-email`          | —                          |
| US-02 Sign in (email or phone number)      | ✅     | `/login`                              | `/login` (admin role only) |
| US-03 Forgot password (OTP via email)      | ✅     | `/forgot-password`, `/reset-password` | links to the client page   |

## Project structure

```text
apps/
├── server/src/
│   ├── common/          # config, constants, errors, middlewares, services (email, jwt), utils, validators
│   ├── databases/       # data source, entities, migrations, seeds
│   ├── docs/            # Swagger (zod-to-openapi)
│   ├── modules/         # each module: *.route → *.controller → *.service → *.repository + dto/
│   │   ├── auth/
│   │   ├── user/
│   │   └── health/
│   └── assets/templates/emails/   # email templates (pug)
├── client/src/
│   ├── lib/             # axios (auto token refresh), API services, zod schemas, types
│   ├── stores/          # authStore (zustand)
│   ├── components/      # GuestRoute, ProtectedRoute, layout
│   └── pages/           # one folder per page: index.tsx + store.ts
└── admin/src/           # same layout as client
```

## Getting started

Requirements: **Node.js ≥ 20** and **pnpm 10** (`npm i -g pnpm`).

```bash
pnpm install
```

### 1. Create the database on Supabase

1. Create a project at https://supabase.com.
2. Go to **Project Settings → Database → Connection string** and pick the **Session pooler** tab. The "Direct connection" string only works over IPv6.
3. Copy the string, which looks like `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`. URL-encode the password if it contains special characters (`@ # / ?` …).

### 2. Configure the server

```bash
cp apps/server/.env.example apps/server/.env
```

Fill in `apps/server/.env`:

- `DATABASE_URL`: the Supabase string from step 1.
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REFRESH_TOKEN_HASH_SECRET`, `AUTH_TOKEN_HASH_SECRET`: random strings of at least 32 characters each. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `SMTP_USER`, `SMTP_PASS`: a Gmail address and its **App Password** (Google Account → Security → App passwords).
  In development, if these are left empty, no email is sent and the **OTP is printed to the server console** instead.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: the admin account created by the seed command.

> Wrap any value that contains `#` in double quotes (e.g. `ADMIN_PASSWORD="your#password"`). Unquoted, everything from `#` onward is treated as a comment.

> `.env` is git-ignored. **Never commit it**, and don't paste secrets into code or group chats.

### 3. Create tables and the admin account

```bash
pnpm migration:run   # creates the users, auth_tokens and refresh_tokens tables
pnpm seed:admin      # creates/updates the admin from ADMIN_EMAIL/ADMIN_PASSWORD (re-run it to reset the admin password)
```

### 4. Run

```bash
pnpm dev          # runs server, client and admin together
# or one at a time:
pnpm dev:server
pnpm dev:client
pnpm dev:admin
```

The client and admin call the API through the Vite proxy (`/api` → `localhost:8080`), so no CORS setup is needed in development.

## Scripts

| Command (run from the repo root)                                                      | Description                                   |
| ------------------------------------------------------------------------------------- | --------------------------------------------- |
| `pnpm dev`                                                                            | Run all three apps                            |
| `pnpm build`                                                                          | Build all three apps                          |
| `pnpm type-check` / `pnpm lint` / `pnpm format`                                       | Type-check / lint / format                    |
| `pnpm migration:run`                                                                  | Apply migrations to the database              |
| `pnpm seed:admin`                                                                     | Create the admin account                      |
| `pnpm --filter @gsx/server migration:generate src/databases/migrations/MigrationName` | Generate a migration after changing an entity |
| `pnpm --filter @gsx/server migration:revert`                                          | Revert the latest migration                   |

## API — E1

Base URL: `/api/v1`. Successful responses look like `{ statusCode, message, data, path, timestamp }`. Validation errors (422) also include an `errors[]` array.

| Method | Endpoint                                                                 | Description                                                          |
| ------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| POST   | `/auth/register`                                                         | Sign up: creates an unverified account and emails an OTP             |
| POST   | `/auth/verify-email`                                                     | Verify the email with the OTP                                        |
| POST   | `/auth/resend-verification`                                              | Resend the verification OTP (once per 60 seconds)                    |
| POST   | `/auth/login`                                                            | Client sign-in; the refresh token is stored in the `rt` cookie       |
| POST   | `/auth/refresh-token`                                                    | Issue a new access token                                             |
| POST   | `/auth/logout`                                                           | Sign out                                                             |
| POST   | `/auth/admin/login` · `/auth/admin/refresh-token` · `/auth/admin/logout` | Same as above for the admin app (`rt_admin` cookie, admin role only) |
| POST   | `/auth/forgot-password`                                                  | Email a password-reset OTP                                           |
| POST   | `/auth/reset-password`                                                   | Set a new password with the OTP and sign out all existing sessions   |
| GET    | `/users/me`                                                              | Current user's profile (Bearer token)                                |
| GET    | `/health`                                                                | Server and database health check                                     |

Security rules in place:

- OTPs are 6 digits and expire after 10 minutes. A code is locked after 5 wrong attempts, and a new one can be requested at most once every 60 seconds. Only an HMAC of the code is stored.
- Forgot-password and resend requests always return the same message, so nobody can probe which emails are registered.
- The access token (15 minutes) lives only in browser memory. The refresh token (7 days) is an httpOnly cookie and is rotated on every use.
- Passwords are hashed with bcrypt, and the auth endpoints are rate-limited.

## Adding a new module (e.g. `product`)

1. Create the entity in `apps/server/src/databases/entities/product.entity.ts`, then run `migration:generate` and `migration:run`.
2. Create `apps/server/src/modules/product/` with `dto/`, `product.repository.ts`, `product.service.ts`, `product.controller.ts` and `product.route.ts`.
3. Register the route in `apps/server/src/modules/index.ts`. Protect it with `AuthMiddleware.authenticate`, and add `AuthMiddleware.authorize([USER_ROLE.ADMIN])` for admin-only routes.
4. Document it for Swagger in `apps/server/src/docs/schemas/`.
5. On the frontend: add a service in `src/lib/services/` and types in `src/lib/types/`, then create the page in `src/pages/<page-name>/` with `index.tsx` and `store.ts`.
