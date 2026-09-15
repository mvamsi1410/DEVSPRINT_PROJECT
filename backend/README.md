# DevSprint LMS Backend — Python Flask

A beginner-friendly Flask + SQLite backend for the DevSprint LMS React/Vite frontend.

## Included
- JWT login and registration
- Learner / Trainer / Admin roles
- SQLite database with SQLAlchemy
- Courses, modules and lessons
- Course enrollment
- Course progress and lesson completion
- Wishlist
- Learner dashboard API
- Assessment result storage
- Lesson discussions
- Admin user list
- Trainer course creation endpoint
- CORS for `http://localhost:5173`
- Seed data matching the current frontend demo

## Folder structure
```text
backend/
├── app/
│   ├── __init__.py
│   ├── auth.py
│   ├── models.py
│   ├── routes.py
│   └── seed.py
├── .env.example
├── .gitignore
├── README.md
├── requirements.txt
└── run.py
```

## Run on Mac / Windows

### 1. Open Terminal in this folder

### 2. Create virtual environment
```bash
python3 -m venv .venv
```
Windows:
```powershell
py -m venv .venv
```

### 3. Activate it
Mac/Linux:
```bash
source .venv/bin/activate
```
Windows PowerShell:
```powershell
.venv\Scripts\Activate.ps1
```

### 4. Install packages
```bash
pip install -r requirements.txt
```

### 5. Start backend
```bash
python run.py
```

Backend URL:
`http://localhost:5000`

Health check:
`http://localhost:5000/api/health`

## Demo accounts
These are development/demo credentials only. Change them before any real deployment.

- Learner: `learner@devsprint.com` / `password123`
- Trainer: `trainer@devsprint.com` / `password123`
- Admin: `admin@devsprint.com` / `password123`

## Main API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend |
| POST | `/api/auth/register` | Create learner |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard` | Learner dashboard |
| GET | `/api/courses` | Courses |
| GET | `/api/courses/<id>` | Course + curriculum |
| POST | `/api/courses/<id>/enroll` | Enroll |
| PUT | `/api/courses/<id>/wishlist` | Add/remove wishlist |
| GET | `/api/my-learning` | Enrolled courses |
| PUT | `/api/lessons/<id>/progress` | Mark lesson complete |
| POST | `/api/assessments/results` | Save assessment result |
| GET | `/api/assessments/results` | Assessment history |
| GET | `/api/lessons/<id>/discussions` | Discussion list |
| POST | `/api/lessons/<id>/discussions` | Post discussion |
| GET | `/api/admin/users` | Admin user list |
| POST | `/api/trainer/courses` | Trainer creates course |

Protected endpoints need:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Connecting the React frontend
The current frontend is still demo/localStorage based. To connect it, replace demo login/data calls with `fetch()` requests to:
```text
http://localhost:5000/api
```

Example login:
```js
const response = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, role })
})
const data = await response.json()
localStorage.setItem('devsprint_token', data.token)
```

Example protected request:
```js
const token = localStorage.getItem('devsprint_token')
const response = await fetch('http://localhost:5000/api/dashboard', {
  headers: { Authorization: `Bearer ${token}` }
})
```

## Important
This is a development-ready project skeleton, not a production deployment for sensitive data. Before production, use HTTPS, strong secrets, secure cookie/token handling, database backups, rate limiting, validation, logging, migrations, and a production database. Never commit `.env` files or real secrets to GitHub.
