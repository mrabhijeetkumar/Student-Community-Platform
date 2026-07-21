# Student Community Platform – Audit (2026-03-18)

## 1) Frontend architecture
- React + Vite SPA with route-based pages and shared `services/api.js` request layer.
- Auth state persisted in `AuthContext`, token-based protected routes.
- Major social surfaces exist: dashboard feed, explore, profile, messages, notifications.

## 2) Backend architecture
- Express + MongoDB (Mongoose), route/controller split.
- JWT auth middleware and role checks for admin routes.
- Socket events used for messaging and live updates.

## 3) Database model review
- `User` had followers/following and now supports follow-request arrays + privacy flag.
- `Message`, `Post`, `Comment`, `Notification` models already wired.
- `VerificationToken` used for registration token flow.

## 4) Auth flow review
- Registration uses verification-link flow with staged token records.
- Login, forgot/reset password, session restore endpoints exist.
- Admin restrictions tied to `SUPER_ADMIN_EMAIL` and admin role.

## 5) API route review
- Core CRUD routes exist for posts/comments/users/messages/notifications.
- User routes needed stronger follow-request management coverage and UX hooks.

## 6) Deployment/config review
- Brevo-based transactional email envs (`BREVO_API_KEY`, sender) are required.
- CORS and security checks are present but need strict production env discipline.

## 7) Broken/weak flows found
- Follow-request backend existed but acceptance/rejection UI was not fully surfaced in dashboard UX.
- Missing remove-follower endpoint for complete relationship lifecycle.
- Follow accept flow lacked explicit acceptance notification to requester.

## Implemented in this iteration
- Added remove-follower backend endpoint and route.
- Added acceptance notification on follow-request accept.
- Added dashboard pending-request card with accept/reject and realtime count updates.
- Added API client helpers for pending requests and remove-follower operation.

## Additional production-hardening updates (2026-03-18)
- Added dedicated `/api/auth/resend-verification` flow so users can safely request a new verification link without re-submitting password/name payloads.
- Added backend resend guardrail (60-second throttle per email request) to reduce verification-email spam and replay abuse.
- Refactored signup/verification flow so signup creates the user exactly once (`isEmailVerified=false`) and verification only updates that existing record (no second user creation path).
- Refactored auth to support one account with multiple roles (`roles[]`) and session-scoped `activeRole` so the same email can safely login to both admin and student sections with strict route isolation.
- Fixed admin user-deletion cleanup bug to remove comments using `userId` (not non-existent `author` field), preventing data-orphan drift.
- Extended dashboard API stats to include `pendingFollowRequests` and `isEmailVerified` so frontend status reflects true persisted backend state after refresh/redeploy.

## Environment & dependency hardening (2026-07-21)
- Added the missing `server/.env.example` (previously undocumented — README referenced a file that did not exist in the repo).
- Regenerated `client/node_modules` and `server/node_modules`; ran `npm audit fix` on both — 0 known vulnerabilities remaining (was 9 on server, 11 on client, mostly transitive via `google-auth-library`, `react-router`, `vite`, `socket.io`).
- Bumped `google-auth-library` 9 → 10 to resolve a transitive `uuid` advisory; `OAuth2Client`/`verifyIdToken` API is unchanged, no code changes required.
- Verified `client` builds cleanly with `vite build` and `server` boots cleanly (syntax-checked every file; confirmed it fails fast and clearly when `MONGO_URI` is unreachable, which is expected behavior, not a bug).
- Added root `package.json` with `install:all` / `dev` / `dev:server` / `dev:client` / `build` / `start` scripts (via `concurrently`) so the app can be installed and run with one command from the repo root.
- Synced `README.md` folder structure and env var names with the actual codebase (several files/dirs had been renamed or added since the doc was last updated: `adminRoutes`, `messageRoutes`, `communityRoutes`, `rateLimitMiddleware`, `sanitizeInput`, `validateRequest`, `PasswordResetToken`, `VerificationToken`, etc. existed in code but not in docs).

## Known limitations (not fixed in this pass, out of scope for "make it run")
- No endpoint for users/admins to create new communities — only 6 seeded communities exist; join/leave only.
- Post images are stored as compressed base64 data URLs directly in MongoDB documents; there is no object storage (S3/Cloudinary) integration.
- Feeds use a flat `limit` with no cursor/offset pagination — "load more" beyond the first page isn't supported server-side yet.
- No automated test suite (no Jest/Vitest config) on either client or server.
- No structured server-side logging (errors are only returned to the client, not persisted/logged anywhere).
