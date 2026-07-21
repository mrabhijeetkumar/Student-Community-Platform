# Student Community Platform Architecture

## Backend

- `controllers/`: route handlers for auth, users, posts, comments, communities, notifications, messages, dashboards, and admin actions.
- `services/`: business logic for password hashing/validation, email delivery (Brevo), Google OAuth verification, notifications, and feed ranking.
- `middleware/`: JWT authentication (`authMiddleware`), admin authorization (`adminMiddleware`), request validation (`validateRequest`, built on `express-validator`), input sanitization (`sanitizeInput`), rate limiting (`rateLimitMiddleware`), and centralized error handling (`errorMiddleware`).
- `models/`: MongoDB entities for users, verification tokens, password-reset tokens, posts, comments, communities, notifications, and messages.
- `routes/`: REST endpoints, each protected by `authMiddleware` and, where relevant, `adminMiddleware`.

### Security measures in place
- `helmet` for HTTP security headers, `x-powered-by` disabled.
- Strict CORS allow-list (`config/security.js`) combining `CLIENT_URL`, `CORS_ORIGINS`, and localhost defaults.
- `config/security.js` refuses to boot without `MONGO_URI`/`JWT_SECRET`, and in production additionally requires a 32+ character `JWT_SECRET` and a non-localhost `MONGO_URI`.
- Passwords hashed with bcrypt (cost factor 12).
- Per-route rate limiting on auth, OTP, login, password-change, post-creation, comment-creation, and message-sending endpoints.
- Request body sanitization against NoSQL-injection-style payloads.
- Request payload size capped at 1MB (`express.json({ limit: "1mb" })`).

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