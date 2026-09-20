# Campus Loop — Full Stack Application

## Quick Start

### Prerequisites
- Node.js 18+ installed
- A GROQ API key (get one free at https://console.groq.com)

---

### 1. Set up the Backend

```bash
cd campus-loop/server
```

Copy the example env and add your GROQ key:
```bash
# Edit .env file:
GROQ_API_KEY=your_actual_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b
JWT_SECRET=your_secure_random_secret_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

Install dependencies (already done if you ran setup):
```bash
npm install
```

Run automated verification tests:
```bash
npm test
```

Start the backend server:
```bash
npm run dev
# or with file watching:
npm run dev:watch
```

The server runs at **http://localhost:5000**

---

### 2. Set up the Frontend

In a new terminal:
```bash
cd campus-loop/client
npm run dev
```

The app runs at **http://localhost:5173**

---

### Demo Accounts

| Role   | Email                    | Password  |
|--------|--------------------------|-----------|
| Admin  | admin@campusloop.in      | admin123  |
| Seller | aryan@student.in         | pass123   |
| Buyer  | priya@student.in         | pass123   |

---

### Features

- 🏪 **Marketplace** — Browse, search and filter listings
- 🤖 **Loop AI** — AI marketplace assistant (click the green button)
- ✨ **AI Listing Enhancement** — Auto-write listings with Groq AI
- 💰 **AI Price Suggestions** — Smart pricing based on market data
- 🔍 **AI Smart Search** — Natural language search
- 💬 **Messaging** — Real buyer-seller chat
- ❤️ **Wishlist** — Save favorite items
- 📊 **Dashboard** — Manage listings, messages, reviews
- 🛡️ **Admin Panel** — Platform management (admin only)
- ⭐ **Reviews** — Seller ratings and feedback

---

### Tech Stack

**Frontend:**
- React + TypeScript
- Tailwind CSS v4
- React Router, Zustand, Axios
- Lucide Icons

**Backend:**
- Node.js + Express + TypeScript
- SQLite (better-sqlite3)
- JWT Authentication
- Multer (file uploads)

**AI:**
- Groq API (qwen/qwen3.8-27b with automatic fallback)
- Server-side only (API key never exposed to browser)

---

### AI Features

All AI features require a valid GROQ_API_KEY in `server/.env`.

Without a key, the app works fully except AI features show a helpful error.

Get a free key at: https://console.groq.com/keys
