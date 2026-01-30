# Travel Projects Dashboard (Frontend)

Next.js dashboard for the Travel Planner API. Lists travel projects and supports creating new projects with optional places (Art Institute artwork IDs).

## Stack

- **Framework:** Next.js 13 (Pages Router)
- **Styling:** Tailwind CSS
- **API:** Proxies requests to the backend via `/api/*`

## Setup

1. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Configure backend URL** (optional)

   By default the app proxies to `http://127.0.0.1:8000`. To point to another backend:

   ```bash
   # .env.local
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   # or for server-side only:
   BACKEND_URL=http://localhost:8000
   ```

3. **Run the backend** (see backend README), then start the frontend:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Scripts

- `npm run dev` — Development server
- `npm run build` — Production build
- `npm start` — Run production server

## Features

- List all travel projects (from backend API)
- Form to create a new project with:
  - Name (required), description, start date
  - Optional places: Art Institute artwork IDs and notes (max 10 per project)
- API errors are shown using the backend’s error message (e.g. validation failures)
