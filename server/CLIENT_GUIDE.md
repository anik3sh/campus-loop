# Campus Loop Backend — Client Handover & API Guide

Welcome to the **Campus Loop Backend API**. This document provides full instructions for deployment, configuration, maintenance, and API integration for the backend server.

---

## 1. System Overview

Campus Loop is an online student-to-student marketplace. The backend provides:
- **JWT Authentication** (Registration, secure bcrypt password hashing, token validation, user suspension checks)
- **Marketplace Listings CRUD** (Search, filter by price/condition/category/campus, sort, pagination, image uploads)
- **Bidirectional Buyer-Seller Messaging** (Conversations, unread message tracking, real-time polling support)
- **User Dashboard & Social Features** (Wishlist/favorites, user ratings & reviews, notification feed, transaction records)
- **Administrative Portal** (Platform KPIs, user suspension management, listing moderation, report resolution)
- **Groq AI Capabilities** (Conversational assistant `Loop AI`, automated listing enhancement, fair price suggestions, natural language smart search, content moderation)

### Tech Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express 4 with TypeScript
- **Database**: SQLite (WAL mode enabled, zero external database setup required)
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **File Storage**: Local Multer storage in `server/uploads/` (proxied to `/uploads`)
- **AI Engine**: Groq Cloud SDK (`qwen/qwen3.8-27b`, with fallback to `openai/gpt-oss-20b`)

---

## 2. Directory Structure

```
server/
├── dist/                   # Compiled production JavaScript files
├── src/
│   ├── ai/                 # Groq AI integrations & prompts
│   │   ├── groq.ts         # Groq client & multi-model fallback executor
│   │   ├── marketplaceAI.ts# Business logic for AI chat, enhance, price & search
│   │   └── prompts.ts      # Structured system prompts & templates
│   ├── middleware/
│   │   └── auth.ts         # JWT authentication, optionalAuth & requireAdmin
│   ├── routes/
│   │   ├── admin.ts        # Admin KPIs, moderation, report & user suspension routes
│   │   ├── auth.ts         # Register, login & current user profile
│   │   ├── listings.ts     # Marketplace listings, image upload, favorites, reports
│   │   ├── messages.ts     # Conversations & buyer-seller chat messages
│   │   ├── misc.ts         # Categories, marketplace stats & AI endpoints
│   │   └── users.ts        # User profile, dashboard, notifications, reviews, transactions
│   ├── tests/
│   │   └── test_backend.ts # Automated end-to-end test suite
│   ├── types/              # Ambient TypeScript definitions
│   ├── db.ts               # SQLite schema initialization & seed data
│   └── index.ts            # Express server initialization, error handling & shutdown
├── uploads/                # Directory for user-uploaded product images
├── .env                    # Active environment variables
├── .env.example            # Template for environment configuration
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

---

## 3. Environment Configuration

The server reads configuration from `server/.env`.

| Variable | Description | Default / Example | Required |
| :--- | :--- | :--- | :--- |
| `PORT` | HTTP port the server listens on | `5000` | No |
| `JWT_SECRET` | Secret key used to sign JWT tokens | `campus_loop_dev_secret_2024` | **Yes (Change in Prod)** |
| `GROQ_API_KEY` | Groq API Key for AI features | `gsk_...` | **Yes for AI** |
| `GROQ_MODEL` | Primary AI model identifier | `qwen/qwen3.8-27b` | No |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` | No |
| `NODE_ENV` | Application environment (`development`/`production`) | `development` | No |

> [!TIP]
> Get a free Groq API key at [https://console.groq.com/keys](https://console.groq.com/keys). If omitted or placeholder, non-AI features continue functioning seamlessly while AI endpoints provide helpful fallback responses.

---

## 4. How to Run

### Development Mode
```bash
cd server
npm install
npm run dev
```

### Production Build & Run
```bash
cd server
npm run build
npm start
```

### Running Automated Test Suite
To verify all routes, auth flows, database operations, error handling, and AI functions:
```bash
cd server
npm test
```

---

## 5. API Reference

All API routes are prefixed with `/api`.

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create a new student account.
  - Body: `{ name, email, password, college?, campus? }`
- `POST /api/auth/login` — Sign in and receive JWT token.
  - Body: `{ email, password }`
- `GET /api/auth/me` — Retrieve current authenticated user (`Bearer <token>`).

### Listings (`/api/listings`)
- `GET /api/listings` — Search & list items with filters.
  - Query params: `q`, `category`, `condition`, `campus`, `min_price`, `max_price`, `sort`, `page`, `limit`
- `GET /api/listings/:id` — Get detailed listing info, seller details, images, and similar items.
- `POST /api/listings` — Create new listing (`multipart/form-data`).
  - Fields: `title`, `description`, `price`, `original_price`, `condition`, `category_id`, `campus`, `is_negotiable`, `tags`, `selling_highlights`, `images` (up to 8 files)
- `PATCH /api/listings/:id` — Update listing or mark as sold.
- `DELETE /api/listings/:id` — Soft-delete/remove listing.
- `POST /api/listings/:id/favorite` — Toggle wishlist item.
- `POST /api/listings/:id/report` — Report inappropriate content.

### Messaging (`/api/messages`)
- `GET /api/messages` — Retrieve user's conversation threads with unread counts.
- `GET /api/messages/:id/messages` — Retrieve chat history and mark messages as read.
- `POST /api/messages` — Start or retrieve a conversation thread between buyer & seller.
  - Body: `{ seller_id, listing_id? }`
- `POST /api/messages/:id/messages` — Send a chat message.
  - Body: `{ content }`

### User Profiles, Reviews & Dashboard (`/api/users`)
- `GET /api/users/:id/profile` — Public profile with active listings, ratings, and reviews.
- `PATCH /api/users/me` — Update bio, campus, college, phone, avatar.
- `GET /api/users/me/dashboard` — Summary KPIs (active listings, sold count, unread messages, wishlist count).
- `GET /api/users/me/notifications` — In-app notification feed.
- `POST /api/users/me/notifications/read` — Mark notifications read.
- `POST /api/users/reviews` — Leave a 1-5 star review for a seller.
- `GET /api/users/me/transactions` — Purchase and sale transaction log.
- `POST /api/users/transactions` — Record a completed item transaction.

### AI Features (`/api/ai`)
- `POST /api/ai/chat` — Conversational assistant query with context of active listings.
- `POST /api/ai/enhance-listing` — Generates optimized title, description, tags, highlights, and price range.
- `POST /api/ai/suggest-price` — Fair resale pricing analysis based on condition and market data.
- `GET /api/ai/smart-search` — Natural language intent search across marketplace inventory.

### Administration (`/api/admin`) *(Requires admin account)*
- `GET /api/admin/stats` — High-level platform KPIs.
- `GET /api/admin/users` — User management directory.
- `PATCH /api/admin/users/:id/suspend` — Suspend or unsuspend abusive users.
- `GET /api/admin/listings` — All listings including flagged and removed items.
- `PATCH /api/admin/listings/:id` — Change listing status directly.
- `GET /api/admin/reports` — Platform incident and spam report queue.
- `PATCH /api/admin/reports/:id` — Resolve or dismiss reports.

---

## 6. Seed Accounts for Testing

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@campusloop.in` | `admin123` | Full admin panel access |
| **Seller** | `aryan@student.in` | `pass123` | Active listings & seller profile |
| **Buyer** | `priya@student.in` | `pass123` | Buyer profile & chats |

---

## 7. Production Deployment Recommendations

1. **Process Management**:
   Use PM2 to run the compiled application as a resilient background service:
   ```bash
   npm run build
   npx pm2 start dist/index.js --name "campus-loop-backend"
   ```
2. **Reverse Proxy (Nginx)**:
   Place Nginx in front of Node.js for SSL/TLS termination and efficient static file delivery:
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /uploads/ {
           alias /path/to/campus-loop/server/uploads/;
           expires 30d;
           add_header Cache-Control "public, no-transform";
       }
   }
   ```
3. **Database Backups**:
   The SQLite database is located at `data/campus_loop.db`. Backup this file regularly (e.g., daily cron job copying with `.backup` command or tar archive).
