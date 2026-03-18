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
