# DevSprint LMS — Frontend

A React (Vite) frontend clone matching the DevSprint LMS screens: login/signup/forgot-password,
Admin control center, Trainer dashboard + course wizard, Learner dashboard, My Learning,
course detail, and a lesson player with an AI Tutor chat panel.

## Run it in VS Code

1. **Install Node.js** (v18 or later) if you don't have it: https://nodejs.org
2. Open this folder (`devsprint-lms-frontend`) in VS Code.
3. Open a terminal in VS Code (`` Ctrl+` `` / `` Cmd+` ``) and run:
   ```bash
   npm install
   npm run dev
   ```
4. Vite will print a local URL (usually `http://localhost:5173`) — it should open
   automatically in your browser. If not, click/open the link manually.
5. On the login screen, pick a role from the **"Login as (demo only)"** dropdown
   (Learner / Trainer / Admin) and hit **Login Now** — there's no real auth yet, it just
   routes you to that role's dashboard.

To build a production bundle: `npm run build` (output goes to `dist/`).

## Project structure

```
src/
  components/      Sidebar, Topbar, DashboardLayout, StatGrid, AITutorWidget
  context/         AuthContext.jsx — mock login/role state (localStorage-based)
  data/            mockData.js — all placeholder content (stats, courses, leaderboard...)
  pages/           One file per screen (Login, AdminDashboard, LessonPlayer, etc.)
  App.jsx          Route table
  index.css        Design tokens + all styling (colors, layout, components)
```

## Connecting to the Python backend

Everything here currently reads from `src/data/mockData.js` and local component state —
no network calls yet. When the backend (developed separately in Python) is ready:

1. Add a small API client, e.g. `src/api/client.js`:
   ```js
   const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

   export async function apiGet(path) {
     const res = await fetch(`${BASE_URL}${path}`)
     if (!res.ok) throw new Error(`GET ${path} failed`)
     return res.json()
   }

   export async function apiPost(path, body) {
     const res = await fetch(`${BASE_URL}${path}`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(body),
     })
     if (!res.ok) throw new Error(`POST ${path} failed`)
     return res.json()
   }
   ```
2. Create a `.env` file (not committed) with:
   ```
   VITE_API_URL=http://localhost:8000
   ```
3. Swap the pieces that currently use `mockData.js` for calls to your backend,
   e.g. in `LearnerDashboard.jsx` replace the imported `enrolledCourses` with
   data fetched in a `useEffect` from `apiGet('/api/courses')`.
4. Real login: in `AuthContext.jsx`, replace the `login()` function's body with a call to
   your backend's auth endpoint (e.g. `POST /api/auth/login`), store the returned token
   instead of a fake user object, and attach it as an `Authorization` header in `apiGet`/`apiPost`.
5. If the Python backend runs on a different port during development, you'll likely want CORS
   enabled on the backend (e.g. `flask-cors` or FastAPI's `CORSMiddleware`) so the browser
   allows requests from `http://localhost:5173`.

## Notes

- Colors, fonts (Inter), and layout are matched to the DevSprint LMS screenshots — sidebar
  navy (`--navy-950`), primary blue (`--blue-600`), and the purple/blue gradient hero banners.
- Sidebar nav items that aren't fully built yet (User Management, Batches, Certificates, etc.)
  route to a "Coming soon" placeholder so navigation doesn't break — swap those in as you
  build out each screen.
- No design/UI library is used — all styling is plain CSS in `src/index.css` so it's easy to
  hand off or restyle without extra dependencies.
