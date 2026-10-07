# SprintDesk

Sprint board and bug tracker for small dev teams. Backend: Node.js, Express, MongoDB, JWT.

## Run locally
```bash
npm install
cp .env.example .env   # then edit the values
npm run dev
npm test
```

## API overview
| Method | Endpoint | Who |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| POST/GET | /api/projects | logged-in user |
| POST | /api/projects/:id/members | project admin |
| POST/GET/PATCH | /api/projects/:id/sprints | admin writes, members read |
| POST/GET/PATCH/DELETE | /api/projects/:id/tickets | members (delete: admin) |
| POST | /api/projects/:id/tickets/:ticketId/comments | members |

## Rules enforced
- Roles per project: admin or developer
- Only one active sprint per project
- Tickets move one step at a time: todo, in_progress, in_review, done
- Assignees must be project members
