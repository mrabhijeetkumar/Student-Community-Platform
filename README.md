# Student Community Platform

Student Community Platform is a dark, dashboard-style social app for students built with React, Vite, Tailwind CSS, Framer Motion, Node.js, Express, MongoDB, and Socket.IO.

The UI is designed around a modern SaaS product shell inspired by collaboration products such as Discord, GitHub, and LinkedIn: sticky navigation, glassmorphism cards, activity feeds, messaging, communities, notifications, and profile analytics.

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, Framer Motion, React Router, Recharts
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, Socket.IO
- Auth: Gmail OTP verification, standard login, Google OAuth

## Features

- Home feed with smart, latest, following, trending, and saved views
- Create post flow with tags, image upload, and community targeting
- Likes, comments, saves, and post editing
- Community discovery with join/leave support
- Dashboard analytics for users and admins
- Real-time style messaging UI and notification workflows
- Profile pages with edit mode, skills, and activity feed
- Responsive three-column app shell with sticky sidebars

## Folder Structure

```text
Student Community Platform/
├── client/src/
│   ├── components/         (CreatePost, Navbar, PostCard, ProtectedRoute, Sidebar, layout/, ui/, CommunityFeedPanel, Notification*)
│   ├── config/api.js
│   ├── context/             (AuthContext, NotificationContext, useAuth, useNotifications)
│   ├── hooks/useTheme.js
│   ├── pages/               (Login, Register, ForgotPassword, VerifyEmail, Dashboard, Explore, Community, Messages, Notifications, Profile, Settings, AdminLogin, AdminPanel)
│   ├── services/            (api.js, socket.js)
│   └── styles/main.css
├── docs/
│   ├── ARCHITECTURE.md
│   └── PLATFORM_AUDIT.md
└── server/
    ├── config/               (db.js, security.js)
    ├── controllers/          (admin, auth, comment, community, dashboard, message, notification, post, user)
    ├── middleware/           (adminMiddleware, authMiddleware, errorMiddleware, rateLimitMiddleware, sanitizeInput, validateRequest)
    ├── models/               (Comment, Community, Message, Notification, PasswordResetToken, Post, User, VerificationToken)
    ├── routes/               (admin, auth, comment, community, dashboard, message, notification, post, user)
    ├── services/             (authService, emailService, feedService, googleService, notificationService)
    ├── socket/socket.js
    └── utils/                (generateToken.js, regexUtils.js)
```

## Setup Instructions

### 1. Install dependencies

From the project root (installs both server and client):

```bash
npm run install:all
```

Or individually:

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

Create `server/.env` from `server/.env.example` (see that file for a full description of every variable):

```bash
cd server
cp .env.example .env
```

Required server values:

```bash
PORT=5050
MONGO_URI=mongodb://127.0.0.1:27017/student-community-platform
JWT_SECRET=replace_me_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
SUPER_ADMIN_EMAIL=you@example.com
```

Optional (leave blank to disable the feature):

```bash
GOOGLE_CLIENT_ID=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Student Community Platform
CORS_ORIGINS=
```

Create `client/.env` from `client/.env.example`:

```bash
cd client
cp .env.example .env
```

```bash
VITE_API_URL=http://localhost:5050/api
VITE_SOCKET_URL=http://localhost:5050
VITE_GOOGLE_CLIENT_ID=
```

### 3. Start the app

From the project root, run both server and client together:

```bash
npm run dev
```

Or run them separately in two terminals:

```bash
npm run dev:server
npm run dev:client
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5050`

> The server needs a running MongoDB instance to fully start (either a local `mongod`, Docker container, or a MongoDB Atlas cluster referenced in `MONGO_URI`). Without it, the server will log a connection error and exit — this is expected until `MONGO_URI` points to a reachable database.

### 4. Optional integrations

- Set `BREVO_API_KEY` to enable verification/password emails via Brevo transactional API.
- `BREVO_SENDER_EMAIL` must be a **verified sender/domain** in Brevo, otherwise API may accept but inbox delivery can fail.
- Set `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` to enable Google sign-in.
- Without BREVO_API_KEY, email delivery endpoints return a clear configuration error.
- Set `SUPER_ADMIN_EMAIL` to your primary admin (e.g. `abhijeetmehtaji@gmail.com`). Only this primary admin can grant/revoke other admin accounts.
- Student forgot-password now returns `Email not found` when no student account exists, and admin forgot-password remains restricted to allowed admin emails.

## UI Notes

- Dark SaaS shell with fixed-width sidebars and a flexible center feed
- Glassmorphism cards built in `client/src/styles/main.css`
- Route-level page heroes for Home, Explore, Communities, Messages, Notifications, and Dashboard
- Framer Motion used for page transitions, hover states, panels, and post interactions

## Build

```bash
cd client && npm run build
```

```bash
cd server && npm start
```