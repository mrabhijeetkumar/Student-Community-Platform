# Student Community Platform

This app now uses **MongoDB Atlas Data API** instead of Supabase for users and posts.

## MongoDB Atlas setup

Create a `.env` file in the project root:

```env
REACT_APP_MONGODB_DATA_API_URL=https://data.mongodb-api.com/app/<your-app-id>/endpoint/data/v1
REACT_APP_MONGODB_DATA_API_KEY=<your-data-api-key>
REACT_APP_MONGODB_DATA_SOURCE=Cluster0
REACT_APP_MONGODB_DATABASE=student_community
REACT_APP_EMAIL_VERIFICATION_WEBHOOK=<your-email-sender-endpoint-optional>
```

Collections expected:

- `users`
- `posts`

If these env vars are not provided, the app falls back to localStorage for local development.

## Available scripts

- `npm start`
- `npm run build`
- `npm test`

## Modern resume-ready features added

- Smart Feed with search (`text/category/#tags`) and `Latest/Trending` ranking
- Post categories (`Project`, `Announcement`, `Doubt/Help`, `Career/Internship`)
- Saved posts (bookmarks) per user
- Opportunities board (internships, open source, hackathons)
- Impact analytics dashboard (posts, likes, comments, consistency streak)
- Profile skills field + portfolio JSON export for resume attachments
- Community moderation queue with post reporting and quick resolution tools
- Basic content-quality guardrails to block harmful terms before publishing
- Learning Hub with curated roadmap/interview/open-source resources
- Weekly Goal Tracker for consistency and accountability
- Top contributor leaderboard based on community impact points
- Next-level profile section with badges, skill chips, readiness checklist, and recruiter-facing hero card

- Gmail OTP verification during signup (account is created only after OTP confirmation)
- Login is allowed only for verified Gmail accounts
