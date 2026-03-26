# AccelerateHR Portal

A premium sales demo platform showcasing HR content, dashboards, data models, and AI use cases. Built for executive and client demos.

## Tech Stack

- **Frontend:** React + Vite, React Router v6, Tailwind CSS, Framer Motion
- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3)
- **Auth:** JWT-based admin authentication

## Quick Start

```bash
# 1. Install all dependencies
cd acceleratehr
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. (Optional) Set up Anthropic API key for AI JD Generator
cp server/.env.example server/.env
# Edit server/.env and add your ANTHROPIC_API_KEY

# 3. Start both frontend and backend
npm run dev
```

The app will be available at:
- **Portal:** http://localhost:5173
- **API:** http://localhost:3001

## Admin Access

- **URL:** http://localhost:5173/admin
- **Email:** admin@acceleratehr.com
- **Password:** AccelerateHR2024!

Change the password after first login via Admin > Settings.

## Portal Sections

| Section | Description |
|---------|-------------|
| **Home** | Hero + module grid linking to all sections |
| **Brochure** | Downloadable PDF/PPT assets uploaded via Admin |
| **Data Models** | HR data model schemas organized by domain |
| **Observation Deck** | Executive dashboard previews with optional iframe embeds |
| **AI Use Cases** | AI-powered HR tools with JD Generator demo |
| **KPI Hub** | Curated library of 20+ HR KPIs with search, filter, export |

## Admin Panel Features

- **Brochure Assets Manager** — Upload files (PDF, PPT, PNG), toggle visibility
- **Data Models Manager** — CRUD with entity schemas and relationships
- **Dashboards Manager** — CRUD with embed URL support and status badges
- **AI Use Cases Manager** — CRUD with built-in demo toggle
- **KPI Manager** — CRUD + bulk CSV import with template download
- **Settings** — Portal title, tagline, company info, password change

## Environment Variables

Create `server/.env`:

```
ANTHROPIC_API_KEY=your-key-here    # Required for AI JD Generator only
JWT_SECRET=your-secret             # Optional, has default
PORT=3001                          # Optional, defaults to 3001
```

## Seed Data Reset

To reset the database to default seed data:

```bash
npm run seed:reset
```

## File Structure

```
acceleratehr/
├── client/                    # React frontend
│   ├── src/
│   │   ├── admin/             # Admin panel pages
│   │   ├── components/        # Shared components
│   │   ├── lib/               # API client, domains config
│   │   ├── pages/             # Public portal pages
│   │   └── main.jsx           # App entry + routing
│   └── vite.config.js
├── server/                    # Express backend
│   ├── db/                    # SQLite schema + seed
│   ├── middleware/            # Auth + upload middleware
│   ├── routes/                # REST API routes
│   └── index.js               # Server entry
├── uploads/                   # Uploaded files (served statically)
└── README.md
```
