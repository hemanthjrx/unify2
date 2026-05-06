# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Auth**: Clerk (`@clerk/express` server-side, `@clerk/react` v6 client-side)
- **File uploads**: multer (saved to `/tmp/unify-uploads`, served at `/api/uploads/:filename`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild composite lib types (run this after changing `lib/db/src/schema/*`)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/scripts run migrate-v2` — run DB migration v2 (adds messages, hackathon fields, is_private, follow status)
- `pnpm --filter @workspace/scripts run seed-communities` — seed 35 communities across 4 categories
- `pnpm --filter @workspace/scripts run seed-main` — seed 50 students (45 approved, 5 pending) + 5 posts per section + 5 marketplace + 5 freelance

## Artifacts

- **api-server** (`artifacts/api-server`) — Express 5 backend with Clerk auth middleware. Routes: users, interests, communities, dashboard, connections, activity, posts, notifications, search, marketplace, freelance, admin, **messages**, **hackathons**. Uses `lib/auth.ts` (`ensureUser` upserts Clerk user into our DB on first request).
- **unify** (`artifacts/unify`) — React + Vite + Tailwind v4 + shadcn/ui + wouter + TanStack Query. Dark theme by default. Auth via Clerk (`@clerk/react` v6 — note: this package does NOT export `SignedIn` / `SignedOut`; use `useAuth()` from `@clerk/react` for gating).
- **mockup-sandbox** (`artifacts/mockup-sandbox`) — design preview server.

### Wouter v3 routing tip
For nested/wildcard routes (e.g. Clerk's `<SignIn routing="path">`), use `path="/sign-in/*?"` — the `:rest*` syntax is **not** valid in wouter v3 (regexparam) and silently fails to match, leaving the page blank.

## Unify domain notes

- DB schema: `users`, `interests`, `user_interests`, `communities` (+bannerImageUrl, +profileImageUrl, +leaderId), `community_members`, `follows`, `activity`, `posts` (+hackathon new fields), `post_likes`, `notifications`, `messages`, `reports`, `warning_strikes`.
- Coin rewards: +5 on community join, +5 on hackathon post, +2 per regular post, +3 per mentorship reply, +2 bonus when reply marked helpful.
- Dashboard practice upload limit: 5.
- Seeded: 26 interests, 35 communities (4 categories), 50 students (45 approved, 5 pending), 5 posts/section.
- Frontend uses generated hooks from `@workspace/api-client-react` (orval). Direct fetch calls use `useAuthenticatedFetch` from `src/lib/api-fetch.ts`.
- `lib/api-init.ts` sets fetch base URL to `window.location.origin` so API calls go through the same proxy.

### Pages / Routes
- `/dashboard` — activity feed, coins, stats
- `/discover` — find people with shared interests
- `/communities`, `/communities/:slug` — community browser and detail
- `/profile` — own profile editor
- `/users/:username` — other user's profile (private lock screen if private + not following)
- `/notifications` — follow requests (Accept/Decline), likes, follows, follow_accepted events
- `/search` — search users + communities
- `/marketplace` — buy/sell items
- `/freelance` — freelance listings
- `/hackathons` — post hackathon invites (date, location, team size, skills, college, fee, problem statement, registration/location links), search bar, like, delete own
- `/messages`, `/messages/:username` — DM split-panel with 3-message pending limit, file attachments
- `/admin` — admin panel (admin role: all tabs; moderator role: Applications + Reports only). Warning strikes system: up to 5 strikes, 5th auto-bans. WarningBanModal (warn + ban sections). Community leader search by name/USN. Admin/Mod panel link shown at TOP of sidebar.

### Private Accounts & Follow Requests
- `users.is_private` (default `true`) — if private, following creates a `pending` follow request + `follow_request` notification
- `follows.status` = `'pending'` | `'accepted'` — existing rows migrated to `accepted`
- Accept/decline via `POST /api/connections/:username/follow/accept|decline`
- `buildUserProfile` returns `followStatus: 'none'|'pending'|'accepted'` and `isPrivate`
- Profile page shows private lock screen if `isPrivate && followStatus !== 'accepted'`

### Messaging Rules
- Pending follow → max 3 messages from sender, then frozen until accepted. Recipient sees "Continue Conversation" button to accept.
- Accepted follow → unlimited messages
- File types: images (.jpg/.jpeg/.png/.gif/.webp), PDFs (.pdf), documents (.doc/.docx). No audio/video.
- File upload: `POST /api/messages/upload` (multer), files served at `/api/uploads/:filename`

### Notifications
- `follow_request` — someone wants to follow a private account
- `follow_accepted` — your follow request was accepted
- `follow` — someone followed you (public account)
- `like` — someone liked your post

### Admin credentials
- Username: `admin`, Password: `admin@1234`
- Make admin: `UPDATE users SET role = 'admin' WHERE username = 'your_username';`

### api-zod export rule
`lib/api-zod/src/index.ts` re-exports Zod schemas from `./generated/api` (values used for `.parse`/`.safeParse`) AND a curated allowlist of TS types from `./generated/types` via `export type { ... }` — explicit list excludes `CreatePostBody` (which exists as a Zod schema in api.ts; the type would collide). When new component schemas are added to `openapi.yaml`, append them to the type re-export list.

### Schema change workflow
After editing `lib/db/src/schema/*.ts`:
1. Run `pnpm run typecheck:libs` to rebuild composite types
2. Run `pnpm --filter @workspace/scripts run migrate-v2` (or write a new migration) to apply to DB
3. Restart the api-server workflow
