# Student Community Platform Architecture

## Backend

- `controllers/`: route handlers for auth, users, posts, comments, notifications, messages, dashboards.
- `services/`: business logic for OTP, email delivery, Google OAuth verification, notifications, feed ranking.
- `middleware/`: authentication, admin authorization, request validation, rate limiting, error handling.
- `models/`: MongoDB entities for users, verification tokens, posts, comments, notifications, messages.
- `routes/`: versioned REST endpoints protected by JWT.

### Auth flow

1. `POST /api/auth/request-otp`
2. Gmail-only email validation and disposable-email blocking
3. OTP stored hashed in `VerificationToken`
4. `POST /api/auth/register` verifies OTP and creates verified user
5. `POST /api/auth/login` and `POST /api/auth/google`

### Social graph

- Users can follow/unfollow
- Feed supports `smart`, `latest`, `following`, and `trending`
- Notifications are emitted for likes, comments, follows, and messages

## Frontend

- React + Vite + Tailwind CSS
- Protected application shell with left navigation, main content, and right insights column
- Pages: Login, Register, Home Feed, Profile, Dashboard, Notifications, Messages
- Reusable hooks for auth and theme state