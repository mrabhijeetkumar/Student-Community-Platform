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
├── client/
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── components/
│       │   ├── CommentBox.jsx
│       │   ├── CreatePost.jsx
│       │   ├── Navbar.jsx
│       │   ├── Notification.jsx
│       │   ├── NotificationPanel.jsx
│       │   ├── PostCard.jsx
│       │   ├── ProfileHeader.jsx
│       │   ├── Sidebar.jsx
│       │   ├── UserCard.jsx
│       │   ├── layout/
│       │   │   ├── AppShell.jsx
│       │   │   └── RightRail.jsx
│       │   └── ui/
│       │       ├── AuthShowcase.jsx
│       │       ├── LoadingCard.jsx
│       │       ├── PageHero.jsx
│       │       ├── PageTransition.jsx
│       │       └── ThemeToggle.jsx
│       ├── context/
│       │   └── AuthContext.js
│       ├── hooks/
│       │   └── useTheme.js
│       ├── pages/
│       │   ├── Community.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Explore.jsx
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── Messages.jsx
│       │   ├── Notifications.jsx
│       │   ├── Profile.jsx
│       │   └── Register.jsx
│       ├── services/
│       │   └── api.js
│       └── styles/
│           └── main.css
├── docs/
│   └── ARCHITECTURE.md
└── server/
    ├── .env.example
    ├── package.json
    ├── server.js
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── authController.js
    │   ├── commentController.js
    │   ├── communityController.js
    │   ├── dashboardController.js
    │   ├── notificationController.js
    │   ├── postController.js
    │   └── userController.js
    ├── middleware/
    │   ├── authMiddleware.js
    │   └── errorMiddleware.js
    ├── models/
    │   ├── Comment.js
    │   ├── Community.js
    │   ├── Message.js
    │   ├── Notification.js
    │   ├── Post.js
    │   └── User.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── commentRoutes.js
    │   ├── communityRoutes.js
    │   ├── notificationRoutes.js
    │   ├── postRoutes.js
    │   └── userRoutes.js
    ├── services/
    │   ├── emailService.js
    │   ├── feedService.js
    │   ├── googleService.js
    │   └── notificationService.js
    ├── socket/
    │   └── socket.js
    └── utils/
        └── generateToken.js
```

## Setup Instructions

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

Create `server/.env` from `server/.env.example`.

Required server values:

```bash
PORT=5050
MONGO_URI=mongodb://localhost:27017/student-community-platform
JWT_SECRET=replace_me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_SERVICE=gmail
```

Create `client/.env` from `client/.env.example`.

```bash
VITE_API_BASE_URL=http://localhost:5050/api
VITE_GOOGLE_CLIENT_ID=
```

### 3. Start the app

In one terminal:

```bash
cd server
npm run dev
```

In another terminal:

```bash
cd client
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:5050`

### 4. Optional integrations

- Set `SMTP_USER` and `SMTP_PASS` for email OTP delivery.
- Set `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID` to enable Google sign-in.
- Without SMTP, OTP falls back to preview mode in non-production environments.

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