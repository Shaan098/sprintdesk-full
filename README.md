# SprintDesk

Sprint board and bug tracker for small dev teams.
Stack: React (Vite), Node.js, Express, MongoDB, JWT.

## Features
- Sign up and log in (JWT, bcrypt-hashed passwords)
- Projects with admin and developer roles; admins add teammates by email
- Sprints with start and complete actions (one active sprint per project)
- Tasks and bugs with priority, assignee, steps to reproduce, and comments
- Kanban board with drag and drop (tickets move one column at a time)
- Sprint progress bar and filters by sprint and ticket type

## Run locally
You need Node 18+ and MongoDB running locally (or a free MongoDB Atlas URI).

Backend (terminal 1):
```bash
cd backend
npm install
npm run dev        # http://localhost:5000, uses backend/.env
npm test
```

Frontend (terminal 2):
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, proxies /api to the backend
```

## Try it
1. Register two accounts (use a private window for the second).
2. Create a project, then add the second user with "Add teammate".
3. Create a sprint, open it from the Sprint menu, and click "Start this sprint".
4. Create tickets, drag them across columns, and add comments.

## Deploy
- Backend on Render: set `MONGO_URI` (Atlas) and `JWT_SECRET`, start command `npm start`.
- Frontend on Vercel: root `frontend`, set `VITE_API_URL=https://<your-backend>/api`.
- Change `JWT_SECRET` in production. The one in `backend/.env` is for local use only.

## Project layout
```
backend/   Express API (models, routes, middleware, tests)
frontend/  React app (Auth, Board, TicketModal)
```
