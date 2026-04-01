# CampusPrint

CampusPrint is a React + Vite frontend with an Express backend and Supabase integration for campus printing workflows.

## Tech Stack
- React + Vite (frontend)
- Express (backend API)
- Supabase (auth + data + storage)
- Tailwind CSS

## Prerequisites
- Node.js 18+ and npm

## Setup
1) Install deps (frontend + shared root)
```bash
npm install
```

2) Install backend deps
```bash
cd backend
npm install
```

3) Environment
- Copy `.env.example` → `.env` and fill `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Copy `backend/.env.example` → `backend/.env` and set:
  - `PORT=5000` (or your choice)
  - `CLIENT_URL=http://localhost:5173`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_STORAGE_BUCKET`

## Run
- Frontend only: `npm run dev` (Vite at http://localhost:5173)
- Backend only: `cd backend && npm run dev` (Express at http://localhost:5000)
- Both together: `npm run dev:all` (uses `scripts/dev-all.mjs` to start backend then frontend)

The frontend auto-targets the backend on port 5000 during Vite dev. Override with `VITE_API_BASE_URL` in `.env` if you change the backend port.
