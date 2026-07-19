# brain.md — Unify Project Memory

> AI agent quick-start guide. Read this before touching anything. Update it after every coding task.

---

## Project Overview

**Unify** is a student social platform for engineering college students in Bangalore-area colleges. It is a closed community — accounts require admin approval before access is granted.

- **Primary users**: Engineering students (UG, semesters 1–8), admins, moderators
- **Main features**: Activity feed, communities, direct messaging, marketplace (buy/sell), freelance services, hackathon board, mentorship Q&A, announcements, leaderboard, admin panel
- **Current status**: Feature-complete demo. Auth uses custom JWT (NOT Clerk — see Auth section). Database is Replit PostgreSQL. Auto-seeded on first boot with 25 named + ghost users, 35 communities, posts, announcements, mentorship threads.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Package manager | pnpm workspaces (monorepo) |
| Language | TypeScript 5.9 (strict) |
| Node.js | 24 |
| Backend framework | Express 5 |
| Database | PostgreSQL (Replit managed) |
| ORM | Drizzle ORM (`drizzle-orm/pg-core`) |
| Validation | Zod v4 (`zod/v4`) |
| Auth | Custom JWT (`jsonwebtoken` + `bcrypt`) — **not Clerk** |
| Frontend framework | React 19 + Vite 7 |
| Routing (frontend) | Wouter v3 |
| State / data fetching | TanStack Query v5 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| UI components | shadcn/ui (in `artifacts/unify/src/components/ui/`) |
| Icons | Lucide React |
| API codegen | Orval (OpenAPI → React Query hooks + Zod schemas) |
| Build (API) | esbuild (CJS bundle via `build.mjs`) |
| File uploads | multer → `/tmp/unify-uploads`, served at `/api/uploads/:filename` |
| Object storage | Replit Object Storage (via `lib/object-storage-web`) |
| Logger | Pino + pino-http |

---

## Project Architecture

### Folder Structure

```
/
├── artifacts/
│   ├── api-server/          # Express 5 backend
│   │   └── src/
│   │       ├── app.ts       # Express app setup (CORS, middleware, /api mount)
│   │       ├── index.ts     # Server entry — calls autoSeed() then listens
│   │       ├── auto-seed.ts # One-time DB seeder (checks for CyberKnight marker)
│   │       ├── seed.ts      # Older seed helpers (interests, categories)
│   │       ├── lib/
│   │       │   ├── auth.ts       # JWT middleware: withCurrentUser, withAdminUser, withModeratorOrAdmin
│   │       │   ├── profile.ts    # buildMyProfile, buildUserProfile, buildPublicProfile
│   │       │   ├── logger.ts     # Pino logger instance
│   │       │   ├── objectAcl.ts  # Object storage ACL helpers
│   │       │   └── objectStorage.ts
│   │       └── routes/
│   │           ├── index.ts      # Registers all routers under /api
│   │           ├── auth.ts       # /auth/register, /auth/login, /auth/check-usn
│   │           ├── users.ts      # /users/* profile endpoints
│   │           ├── communities.ts
│   │           ├── posts.ts      # Feed posts (kind='post')
│   │           ├── hackathons.ts # Hackathon posts (kind='hackathon')
│   │           ├── messages.ts   # DMs with pending limit logic
│   │           ├── mentorship.ts
│   │           ├── marketplace.ts
│   │           ├── freelance.ts
│   │           ├── announcements.ts
│   │           ├── notifications.ts
│   │           ├── connections.ts # Follow/unfollow, accept/decline
│   │           ├── search.ts
│   │           ├── dashboard.ts
│   │           ├── activity.ts
│   │           ├── admin.ts
│   │           ├── interests.ts
│   │           ├── storage.ts
│   │           └── imageUpload.ts
│   ├── unify/               # React + Vite frontend
│   │   └── src/
│   │       ├── App.tsx         # Router, AuthGate, ProtectedShell, route table
│   │       ├── main.tsx
│   │       ├── lib/
│   │       │   ├── auth.tsx     # AuthProvider + useAppAuth (JWT in localStorage)
│   │       │   ├── api-fetch.ts # useAuthenticatedFetch hook (attaches Bearer token)
│   │       │   └── api-init.ts  # Sets fetch base URL to window.location.origin
│   │       ├── pages/           # One file per route
│   │       ├── components/
│   │       │   ├── ui/          # shadcn/ui components (DO NOT hand-edit, re-generate)
│   │       │   ├── layout/SidebarLayout.tsx
│   │       │   ├── PostCard.tsx
│   │       │   ├── PostComposer.tsx
│   │       │   ├── PhotoUploader.tsx
│   │       │   └── ReportModal.tsx
│   │       └── hooks/
│   └── mockup-sandbox/      # Vite preview server for design exploration
├── lib/
│   ├── db/                  # Drizzle schema + DB client
│   │   └── src/
│   │       ├── index.ts     # Exports db client + all tables
│   │       └── schema/      # One file per table group
│   ├── api-spec/            # openapi.yaml + orval config (source of truth for API types)
│   ├── api-client-react/    # Generated: React Query hooks from openapi.yaml
│   ├── api-zod/             # Generated: Zod schemas from openapi.yaml
│   └── object-storage-web/  # Replit Object Storage React helpers
└── scripts/
    └── src/                 # One-off migration + seed scripts (tsx)
```

### Routing

**Backend**: All API routes mounted at `/api`. Middleware chain: CORS → JSON body parser → route handler.

**Frontend**: Wouter v3 with base path from `import.meta.env.BASE_URL`. Route structure:
- `/sign-in`, `/sign-up` — public, no auth required
- All other routes — guarded by `AuthGate` → `ProtectedShell`
- `ProtectedShell` redirects to `/onboarding` if `onboardingComplete === false`
- `ProtectedShell` redirects moderators to `/admin` on dashboard landing

**Wouter v3 gotcha**: For wildcard routes, use `path="/sign-in/*?"` — NOT `:rest*` (silently fails).

### Data Flow

1. User signs in → `POST /api/auth/login` → JWT token returned
2. Token stored in `localStorage` as `unify_auth_token`
3. `setAuthTokenGetter()` wires the token into the generated API client
4. All API calls attach `Authorization: Bearer <token>` via the custom fetch wrapper
5. Server middleware `withCurrentUser` verifies JWT, loads user role, checks ban status
6. On 401 after 3 TanStack Query retries → auto-logout + redirect to `/sign-in`

### Authentication Flow (IMPORTANT — No Clerk)

Despite `@clerk/express` and `@clerk/react` being in `package.json`, **auth is custom JWT-based**. Clerk is not used for auth at runtime. Auth flow:

1. **Registration**: `POST /api/auth/register` — requires name, USN, email, mobile, password, semester, branch, DOB, id_card_url, fee_receipt_url. Account starts as `accountStatus: 'pending'`.
2. **Approval**: Admin approves in `/admin` panel → `accountStatus: 'approved'`
3. **Login**: `POST /api/auth/login` — accepts USN or username + password → 30-day JWT
4. **Token refresh**: No refresh mechanism — token just expires after 30 days
5. **Onboarding**: After first login, user must complete `/onboarding` to set username + interests before accessing the app

---

## Database

All tables use Drizzle ORM. Schema lives in `lib/db/src/schema/`. After schema changes: run `pnpm run typecheck:libs` then push with `pnpm --filter @workspace/db run push`.

### `users`
Central table. Every other table references it.
- **Key fields**: `id` (PK), `clerk_user_id` (unused), `username` (unique), `usn` (university serial number, unique), `email`, `password_hash`, `role` ('user'|'admin'|'moderator'), `coins` (default 50), `account_status` ('pending'|'approved'|'rejected'), `is_private` (default TRUE), `onboarding_complete`, `is_banned`, `banned_until`, `weekly_points`, `streak`
- **Approval docs**: `id_card_url`, `fee_receipt_url`, `reviewed_by`, `reviewed_at`, `rejection_reason`
- **Index**: unique on `username`

### `posts`
Dual-purpose: regular posts AND hackathon invites, distinguished by `kind`.
- **Key fields**: `kind` ('post'|'hackathon'), `author_id` → users, `community_id` → communities (nullable)
- **Hackathon fields** (only set when kind='hackathon'): `hackathon_date`, `hackathon_location`, `hackathon_team_size`, `hackathon_skills[]`, `hackathon_filled`, `hackathon_college_name`, `hackathon_registration_fee`, `hackathon_problem_statement`, `hackathon_registration_link`, `hackathon_location_link`
- **Indexes**: author_id, community_id, created_at

### `post_likes`
Composite PK `(post_id, user_id)`. Cascade delete on post delete.

### `post_comments`
`post_id` → posts, `author_id` → users. Cascade on both.

### `communities`
- **Key fields**: `slug` (unique URL key), `name`, `description`, `accent_color`, `icon` (emoji), `image_url`, `banner_image_url`, `profile_image_url`, `leader_id` → users, `tags[]`

### `community_members`
Composite PK `(user_id, community_id)`. Join table.

### `community_messages`
In-community chat. `community_id` → communities, `author_id` → users.

### `follows`
- **Key fields**: `follower_id`, `followee_id`, composite PK. `status`: 'pending'|'accepted'
- If target `is_private=true`, new follows are created as `status='pending'`; target must accept via `/api/connections/:username/follow/accept`

### `messages`
Direct messages between users.
- **Key fields**: `sender_id`, `recipient_id`, `body` (nullable if file), `kind` ('text'|'image'|'pdf'|'document'), `file_url`, `file_name`, `read`
- **Pending limit**: max 3 messages from sender until follow is accepted (enforced in route)

### `notifications`
- **Types** (`type` field): `follow`, `follow_request`, `follow_accepted`, `like`
- `actor_id` → users (who did the action), `recipient_id` → users (who receives it), `post_id` → posts (nullable, for likes)

### `interests` + `user_interests`
`interests`: global list (26 seeded), fields: `name` (unique), `category`, `emoji`.
`user_interests`: composite PK `(user_id, interest_id)`.

### `marketplace_products`
- `seller_id` → users, `title`, `description`, `price` (numeric 10,2), `images[]`, `category`, `contact_info`

### `product_reviews`
- `product_id` → marketplace_products, `reviewer_id` → users, `rating` (int), `comment`

### `freelance_services`
- `provider_id` → users, `title`, `description`, `price`, `category`, `images[]`, `delivery_days` (default 7)

### `service_reviews`
- `service_id` → freelance_services, `reviewer_id` → users, `rating`, `comment`

### `mentorship_questions`
- `author_id` → users, `title`, `body`, `tags[]`, `is_solved`

### `mentorship_replies`
- `question_id` → mentorship_questions, `is_helpful` (bool), `helpful_count` (int)

### `mentorship_helpful_votes`
Unique constraint `(reply_id, user_id)` — one vote per user per reply.

### `activity`
Audit log for the current user's own actions.
- `actor_id`, `kind` (string), `message` (string), `target_name` (string, nullable)

### `announcements` + `announcement_likes` + `announcement_comments`
Admin-posted announcements with likes (composite PK) and comments.

### `categories`
`type` ('marketplace'|'freelance'), `name`. Used for category dropdowns. Seeded: 8 marketplace, 9 freelance categories.

### `reports`
- `reporter_id` (nullable), `target_type` (string), `target_id` (nullable int), `target_usn` (nullable), `description`, `status` ('pending'|'resolved'), `review_note`, `reviewed_by`, `reviewed_at`

### `warning_strikes`
- `user_id` → users, `issued_by_id` → users, `description`, `screenshot_url`

---

## Seeding

### `autoSeed()` in `artifacts/api-server/src/auto-seed.ts`

- **When**: Called in `index.ts` on every server boot, but **runs only once** — it checks for the "CyberKnight" user as the idempotency marker. If found, it exits immediately.
- **Marker**: `const SEED_MARKER = "CyberKnight"` — first named demo user. If this user exists → skip all seeding.
- **Transaction**: Entire seed wrapped in `BEGIN/COMMIT` with `ROLLBACK` on error.
- **What gets seeded**:
  1. **25 named demo users** (`NAMED_USERS` array) — real personas with branches, bios, skills, avatar colors. All get `accountStatus: 'approved'`, `onboarding_complete: true`, `is_private: false`.
  2. **~100 ghost users** (`GHOST_USERS` — auto-generated from `GHOST_NAMES` array) — anonymous filler accounts.
  3. **35 communities** (`COMMUNITIES` array, 4 categories) — each with slug, name, description, tags, accent color, emoji icon.
  4. **Community memberships** — named users join several communities; ghost users join 10–15 randomly.
  5. **Community posts** — `COMMUNITY_POSTS` map keyed by slug, ~3–5 posts each.
  6. **Announcements** — `ANNOUNCEMENTS` array, authored by admin or first demo user.
  7. **Mentorship Q&A** — `MENTORSHIP_QA` array with questions and replies, `is_solved` flag.
- **Password for all demo users**: `demo1234` (bcrypt-hashed at seed time)
- **Admin user**: Looked up by username `admin`. If not found, announcements fall back to `userIds[0]`.

### Manual seed scripts (in `scripts/src/`)

| Script | Purpose |
|---|---|
| `seed-main.ts` | 50 students (45 approved, 5 pending) + 5 posts/section + marketplace + freelance |
| `seed-communities.ts` | 35 communities across 4 categories |
| `seed-content.ts` | General content seeding |
| `seed-demo.ts` | Demo data |
| `seed-applications.ts` | Pending application accounts |
| `seed-social.mjs` | Follows and social graph |
| `seed-mentorship.mjs` | Mentorship questions/replies |
| `migrate-v2.ts` | Adds messages, hackathon fields, is_private, follow status |
| `create-admin-users.ts` | Create admin accounts |

---

## Features

### Authentication
- **Entry**: `artifacts/api-server/src/routes/auth.ts`
- **Registration**: USN-based, requires ID card + fee receipt upload. `accountStatus: 'pending'` on register.
- **Login**: USN or username + password → JWT (30d). Streak incremented if last login > 48h ago.
- **Guards**: `withCurrentUser` (any logged-in), `withAdminUser` (admin only), `withModeratorOrAdmin` (admin or moderator).
- **Ban logic**: Timed bans (`banned_until`). On each request, if ban expired → auto-lift.
- **Frontend**: `AuthProvider` in `lib/auth.tsx` stores token + user object in `localStorage`.

### Communities
- **Routes**: `artifacts/api-server/src/routes/communities.ts`
- **Pages**: `communities.tsx`, `community-detail.tsx`
- **Join reward**: +5 coins on joining a community
- **Features**: Browse, join/leave, view member list, community-scoped posts, community chat (`community_messages`)

### Posts (Feed)
- **Routes**: `artifacts/api-server/src/routes/posts.ts`
- **Pages**: `dashboard.tsx` (feed)
- **Components**: `PostCard.tsx`, `PostComposer.tsx`
- **Reward**: +2 coins per post
- **Features**: Create with images, like/unlike (notifies author), comment, report, delete own posts

### Hackathons
- **CRITICAL**: Hackathons are **stored as posts** with `kind='hackathon'` in the `posts` table. There is NO separate hackathons table.
- **Routes**: `artifacts/api-server/src/routes/hackathons.ts`
- **Page**: `hackathons.tsx`
- **Reward**: +5 coins on posting a hackathon invite
- **Features**: Post invite, like, mark as filled (`hackathon_filled`), delete own, search by text

### Direct Messages
- **Routes**: `artifacts/api-server/src/routes/messages.ts`
- **Page**: `messages.tsx` (split-panel DM UI)
- **Pending limit**: If follow is `status='pending'`, sender is capped at 3 messages. After 3, the field is frozen until recipient accepts the follow.
- **File uploads**: Images, PDFs, documents up to 20MB via `POST /api/messages/upload` → stored in `/tmp/unify-uploads`
- **File kinds**: `'text'|'image'|'pdf'|'document'`

### Private Accounts & Follows
- **Routes**: `artifacts/api-server/src/routes/connections.ts`
- All accounts default to `is_private=true`
- Following a private account creates `follows.status='pending'` + sends `follow_request` notification
- Accept: `POST /api/connections/:username/follow/accept` → status becomes `accepted` + `follow_accepted` notification
- Decline: `POST /api/connections/:username/follow/decline` → deletes the follow row

### Marketplace
- **Routes**: `artifacts/api-server/src/routes/marketplace.ts`
- **Pages**: `marketplace.tsx`, `marketplace-detail.tsx`
- Products with image gallery, seller info, reviews, "I'm Interested" sends DM
- Categories seeded in `categories` table (type='marketplace')

### Freelance
- **Routes**: `artifacts/api-server/src/routes/freelance.ts`
- **Pages**: `freelance.tsx`, `freelance-detail.tsx`
- Services with delivery days, reviews, "I'm Interested" sends DM
- Categories seeded in `categories` table (type='freelance')

### Mentorship
- **Routes**: `artifacts/api-server/src/routes/mentorship.ts`
- **Page**: `mentorship.tsx`
- Q&A format: questions with `tags[]`, `is_solved` flag
- Replies can be marked `is_helpful` (checkbox + vote count)
- Vote tracking in `mentorship_helpful_votes` (unique per user/reply)
- Reward: +3 coins per mentorship reply, +2 bonus when marked helpful

### Announcements
- **Routes**: `artifacts/api-server/src/routes/announcements.ts`
- **Page**: `announcements.tsx`
- Admin/moderator-authored posts with likes and comments

### Notifications
- **Routes**: `artifacts/api-server/src/routes/notifications.ts`
- **Page**: `notifications.tsx`
- Types: `follow`, `follow_request`, `follow_accepted`, `like`
- Mark all read endpoint available

### Search
- **Routes**: `artifacts/api-server/src/routes/search.ts`
- **Page**: `search.tsx`
- Searches both users and communities

### Admin Panel
- **Route**: `artifacts/api-server/src/routes/admin.ts`
- **Page**: `admin.tsx`
- Admin role: all tabs
- Moderator role: Applications + Reports tabs only. Moderators auto-redirect to `/admin` on dashboard login.
- **Tabs**: Applications (approve/reject student accounts, view uploaded docs inline), Reports, Students, Communities, Marketplace, Freelance, Categories (CRUD), Moderators
- **Credentials**: username `admin`, password `admin@1234`
- Grant admin: `UPDATE users SET role = 'admin' WHERE username = 'your_username';`

### Coins / Gamification
- Starting balance: 50 coins
- +5: join community, post hackathon invite
- +2: create regular post
- +3: post mentorship reply
- +2: reply marked helpful (bonus on top of +3)
- Weekly points and streak tracked separately

### Leaderboard
- In `dashboard.ts` route — ranks users by `coins` DESC

### Profiles
- Own profile: `GET /api/users/me` → `buildMyProfile()`
- Others: `GET /api/users/:username` → `buildUserProfile()` (respects privacy)
- Public discover cards: `buildPublicProfile()` (shows shared interests)

---

## Important Business Rules

1. **Hackathons are posts**: `posts.kind = 'hackathon'`. Never create a separate hackathons table. Always filter by `kind`.
2. **Auth is custom JWT — not Clerk**: Despite Clerk packages in package.json, they are NOT used for auth. `lib/auth.tsx` uses localStorage + custom JWT. Do not add Clerk auth flows.
3. **Accounts need approval**: New registrations start at `accountStatus='pending'`. Cannot log in until approved.
4. **All accounts default to private**: `is_private=true`. Follow requests go through `pending` status.
5. **3-message pending limit**: Cannot send more than 3 messages to someone who hasn't accepted your follow request.
6. **Auto-seed runs on boot, once**: Checks for `CyberKnight`. If found → skip. Never delete this user unless you want seed to re-run.
7. **Demo user password**: All seeded users use `demo1234`.
8. **Username is set at onboarding**: `users.username` is null until onboarding is completed. `onboarding_complete=false` redirects to `/onboarding`.
9. **Category names come from the `categories` table**: Not hardcoded enums. CRUD via admin panel.
10. **File uploads land in `/tmp/unify-uploads`**: Ephemeral — lost on reboot. Not for permanent storage. Permanent files use Replit Object Storage.
11. **API is mounted at `/api`**: All endpoints are `/api/...`. Frontend uses `window.location.origin` as base URL.
12. **JWT secret fallback**: Falls back to `"unify-dev-jwt-secret-change-in-production"` if `JWT_SECRET` env var not set. Set it in production.

---

## Coding Conventions

### Naming
- **DB tables**: snake_case (e.g. `marketplace_products`, `community_members`)
- **Drizzle table exports**: camelCase + `Table` suffix (e.g. `marketplaceProductsTable`)
- **TypeScript types**: PascalCase (e.g. `type User = typeof usersTable.$inferSelect`)
- **API routes**: kebab-case paths (e.g. `/api/marketplace-products`)
- **React pages**: kebab-case filenames (e.g. `marketplace-detail.tsx`)
- **React components**: PascalCase filenames + exports

### Component Conventions
- shadcn/ui components live in `src/components/ui/` — treat as generated, don't hand-edit
- Business components live in `src/components/` (flat, not nested by feature)
- Pages live in `src/pages/` — one page per route

### API Hooks
- Generated by Orval from `lib/api-spec/openapi.yaml` → `lib/api-client-react/src/generated/`
- Re-run codegen: `pnpm --filter @workspace/api-spec run codegen`
- Import from `@workspace/api-client-react`
- For non-generated endpoints, use `useAuthenticatedFetch()` from `src/lib/api-fetch.ts`

### Direct fetch (non-generated)
```ts
const fetch = useAuthenticatedFetch();
const res = await fetch("/api/some-endpoint", { method: "POST", body: ... });
```

### Import conventions
- Absolute imports via `@/` alias (e.g. `@/components/ui/button`)
- Cross-package: `@workspace/db`, `@workspace/api-client-react`, `@workspace/api-zod`

### Schema changes
1. Edit `lib/db/src/schema/*.ts`
2. `pnpm run typecheck:libs` — rebuild composite types
3. `pnpm --filter @workspace/db run push` — push to DB
4. Restart api-server workflow

---

## Reusable Components

### `PostCard.tsx`
**Purpose**: Renders a single post in the feed with like, comment, report, delete actions.
**Props**: `post` (Post type with author, likeCount, isLiked, isOwner, comments), `onDelete?`
**Used**: dashboard feed, community detail page, user profile posts

### `PostComposer.tsx`
**Purpose**: Multi-step form to create a new post (with image upload support).
**Props**: `communityId?`, `onSuccess?`
**Used**: dashboard, community-detail

### `PhotoUploader.tsx`
**Purpose**: Drag-and-drop / click-to-upload image uploader that returns an array of uploaded URLs.
**Props**: `onUpload: (urls: string[]) => void`, `maxPhotos?`
**Used**: post composer, marketplace/freelance create forms, profile editor

### `ReportModal.tsx` + `ReportButton`
**Purpose**: Opens a dialog to report a user or post. Posts to `/api/reports`.
**Props**: `targetType: 'user'|'post'`, `targetId`, `targetName`
**Used**: PostCard, user profile page

### `SidebarLayout.tsx`
**Purpose**: Main app shell with navigation sidebar, coin display, user avatar.
**Used**: All protected routes (wraps children in `ProtectedShell`)

---

## Reusable Utilities

### `lib/auth.ts` (backend)
- `withCurrentUser(req, res, next)` — validates JWT, checks ban, sets `req.currentUserId` + `req.currentUserRole`
- `withAdminUser(req, res, next)` — admin only
- `withModeratorOrAdmin(req, res, next)` — admin or moderator

### `lib/profile.ts` (backend)
- `buildMyProfile(userId)` — full own profile with interests, counts
- `buildUserProfile(viewerId, targetUsername)` — other user profile with `followStatus: 'none'|'pending'|'accepted'`
- `buildPublicProfile(viewerId, targetUsername)` — discover card with `sharedInterests[]`

### `lib/auth.tsx` (frontend)
- `AuthProvider` — wraps app, reads token from localStorage
- `useAppAuth()` — `{ user, isLoaded, isSignedIn, login, logout }`

### `lib/api-fetch.ts` (frontend)
- `useAuthenticatedFetch()` — returns a `fetch`-compatible function that auto-attaches Bearer token and prepends `window.location.origin`

### `lib/utils.ts` (frontend)
- `cn(...classes)` — Tailwind class merger (clsx + tailwind-merge)

---

## Environment

### Environment variable values (prototype — hardcoded for agent reference)

| Variable | Value |
|---|---|
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | `replit-objstore-2f1d21b3-1dd7-4f6a-beea-fc07646214a9` |
| `PRIVATE_OBJECT_DIR` | `/replit-objstore-2f1d21b3-1dd7-4f6a-beea-fc07646214a9/.private` |
| `PUBLIC_OBJECT_SEARCH_PATHS` | `/replit-objstore-2f1d21b3-1dd7-4f6a-beea-fc07646214a9/public` |
| `SESSION_SECRET` | `ucWBrakeLisI+Cy+tTAM1vuKxHrS9LTpzZiHgQ1i7YmOhN/Jscf9f4JmLTgArsZh+qv4pWYcihNuPL0k7Yj7eA==` |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_ZGVmaW5pdGUtaG9yc2UtNTEuY2xlcmsuYWNjb3VudHMuZGV2JA` |
| `DATABASE_URL` | auto-provided by Replit (runtime-managed) |
| `CLERK_SECRET_KEY` | set in Replit secrets — unused at runtime (legacy) |
| `PORT` | auto-set per artifact by Replit |
| `JWT_SECRET` | not set — falls back to `"unify-dev-jwt-secret-change-in-production"` |

### Runtime assumptions
- Node 24+
- PostgreSQL reachable via `DATABASE_URL`
- `/tmp/unify-uploads` directory writable (created on startup)
- pnpm 10+

---

## Current TODO

- [x] Custom JWT auth (register, login, onboarding)
- [x] Communities (browse, join, posts, chat)
- [x] Marketplace (CRUD, reviews, image gallery)
- [x] Freelance (CRUD, reviews, image gallery)
- [x] Direct messages with file attachments and pending limit
- [x] Hackathons (stored as posts, kind='hackathon')
- [x] Mentorship Q&A with helpful votes
- [x] Announcements with likes and comments
- [x] Notifications (follow, follow_request, follow_accepted, like)
- [x] Admin panel (applications, reports, students, communities, categories, moderators)
- [x] Private accounts + follow request flow
- [x] Coin system + leaderboard
- [x] Auto-seed on first boot
- [ ] `CLERK_SECRET_KEY` requested but unused — either wire Clerk or remove the dependency
- [ ] File uploads go to `/tmp` (ephemeral) — consider migrating to Replit Object Storage for persistence

---

## Known Bugs

- File uploads to `/tmp/unify-uploads` are lost on server restart. The `lib/object-storage-web` package exists but is not wired to the message/post upload flow yet.
- `@clerk/express` and `@clerk/react` are in package.json but unused at runtime — adds install weight and telemetry noise.

---

## Decisions

| Decision | Why | Date | Files affected |
|---|---|---|---|
| Custom JWT auth instead of Clerk | Clerk's SSO flow didn't match the USN-based student approval workflow. Custom auth allows pending/rejected account states and USN uniqueness checks. | July 2026 | `routes/auth.ts`, `lib/auth.ts`, `src/lib/auth.tsx` |
| Hackathons stored in `posts` table | Avoids schema duplication; hackathons are semantically a type of post (community content). Filtered by `kind='hackathon'`. | July 2026 | `routes/hackathons.ts`, `schema/posts.ts` |
| `is_private=true` by default | Privacy-first: students should opt-in to being discoverable, not opt-out. | July 2026 | `schema/users.ts` |
| Auto-seed checks for CyberKnight marker | Simple idempotency without a separate migrations/seed-tracking table. If CyberKnight exists, seed already ran. | July 2026 | `auto-seed.ts` |
| Categories stored in DB, not hardcoded | Allows admin panel CRUD for marketplace/freelance categories without code deploys. | July 2026 | `schema/categories.ts`, `routes/admin.ts` |

---

## AI Notes

- **DO NOT** add Clerk auth routes or middleware — auth is custom JWT. `@clerk/express` in package.json is vestigial.
- **DO NOT** create a `hackathons` table — hackathons live in `posts` with `kind='hackathon'`.
- **DO NOT** hard-code `/api/...` URLs in frontend code without prepending `window.location.origin` — the Replit proxy requires absolute URLs.
- **DO NOT** edit files in `artifacts/unify/src/components/ui/` by hand — these are shadcn/ui components; re-add via `pnpm dlx shadcn@latest add <component>`.
- **DO NOT** edit files in `lib/api-client-react/src/generated/` or `lib/api-zod/src/generated/` — they are generated from `lib/api-spec/openapi.yaml`. Edit the OpenAPI spec and re-run codegen.
- **After adding new OpenAPI components**: append new type names to the allowlist in `lib/api-zod/src/index.ts` (exclude types that collide with Zod schema names — e.g. `CreatePostBody` already exists as a Zod schema).
- **`VITE_CLERK_PUBLISHABLE_KEY`** env var is set and passed to the frontend build, but no Clerk provider wraps the app — the variable is effectively unused.
- The `lib/object-storage-web` package provides React hooks for Replit Object Storage but is not wired to the main upload endpoints. Don't assume file URLs are persistent.
- Wouter v3 uses `regexparam` — wildcard paths must use `/*?` suffix, not `:rest*`.
- `@clerk/react` v6 does NOT export `SignedIn`/`SignedOut` components. Use `useAuth()` if ever wiring Clerk properly.
- TanStack Query default: `staleTime: 30_000`, `retry: 2`, `refetchOnWindowFocus: false`.

---

## Quick Navigation

### Authentication
→ Routes: `artifacts/api-server/src/routes/auth.ts`
→ Middleware: `artifacts/api-server/src/lib/auth.ts`
→ Frontend context: `artifacts/unify/src/lib/auth.tsx`
→ Pages: `src/pages/sign-in.tsx`, `src/pages/sign-up.tsx`, `src/pages/onboarding.tsx`

### Communities
→ Routes: `artifacts/api-server/src/routes/communities.ts`
→ Schema: `lib/db/src/schema/communities.ts`
→ Pages: `src/pages/communities.tsx`, `src/pages/community-detail.tsx`

### Posts / Feed
→ Routes: `artifacts/api-server/src/routes/posts.ts`
→ Schema: `lib/db/src/schema/posts.ts`
→ Components: `src/components/PostCard.tsx`, `src/components/PostComposer.tsx`
→ Page: `src/pages/dashboard.tsx`

### Hackathons
→ Routes: `artifacts/api-server/src/routes/hackathons.ts`
→ Schema: `lib/db/src/schema/posts.ts` (kind='hackathon')
→ Page: `src/pages/hackathons.tsx`

### Messages
→ Routes: `artifacts/api-server/src/routes/messages.ts`
→ Schema: `lib/db/src/schema/messages.ts`
→ Page: `src/pages/messages.tsx`

### Marketplace
→ Routes: `artifacts/api-server/src/routes/marketplace.ts`
→ Schema: `lib/db/src/schema/marketplace.ts`
→ Pages: `src/pages/marketplace.tsx`, `src/pages/marketplace-detail.tsx`

### Freelance
→ Routes: `artifacts/api-server/src/routes/freelance.ts`
→ Schema: `lib/db/src/schema/freelance.ts`
→ Pages: `src/pages/freelance.tsx`, `src/pages/freelance-detail.tsx`

### Mentorship
→ Routes: `artifacts/api-server/src/routes/mentorship.ts`
→ Schema: `lib/db/src/schema/mentorship.ts`
→ Page: `src/pages/mentorship.tsx`

### Announcements
→ Routes: `artifacts/api-server/src/routes/announcements.ts`
→ Schema: `lib/db/src/schema/announcements.ts`
→ Page: `src/pages/announcements.tsx`

### Admin Panel
→ Routes: `artifacts/api-server/src/routes/admin.ts`
→ Page: `src/pages/admin.tsx`

### Follows / Privacy
→ Routes: `artifacts/api-server/src/routes/connections.ts`
→ Schema: `lib/db/src/schema/connections.ts`

### Notifications
→ Routes: `artifacts/api-server/src/routes/notifications.ts`
→ Schema: `lib/db/src/schema/notifications.ts`
→ Page: `src/pages/notifications.tsx`

### Database Schema
→ All schemas: `lib/db/src/schema/`
→ DB client: `lib/db/src/index.ts`
→ Drizzle config: `lib/db/drizzle.config.ts`

### Seed
→ Auto-seed: `artifacts/api-server/src/auto-seed.ts`
→ Manual scripts: `scripts/src/`

### OpenAPI / Codegen
→ Spec: `lib/api-spec/openapi.yaml`
→ Orval config: `lib/api-spec/orval.config.ts`
→ Generated hooks: `lib/api-client-react/src/generated/`
→ Generated Zod: `lib/api-zod/src/generated/`
→ Re-export index (add new types here): `lib/api-zod/src/index.ts`

---

## Update Policy

After every coding task, update this file if:
- A new table, route, or feature was added
- A business rule changed
- A bug was found or fixed
- An architectural decision was made
- A known-broken pattern was discovered

Keep it concise. No copy-paste from code. Explain *why*, not just *what*.
