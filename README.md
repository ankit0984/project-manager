# Ethara AI — Project & Task Management System

A full-stack web application for managing teams, projects, and tasks with role-based access control. Built with Next.js 16, React 19, MongoDB, and shadcn/ui.

---

## Features

### Admin
- **Dashboard** — Overview stats, 6-month task progress chart, recent team members table
- **Team Management** — Create, edit, and delete teams; assign members
- **Project Management** — Create and manage projects linked to teams
- **Task Management** — Assign tasks to individual members or an entire team at once; track status and due dates
- **User Management** — Create individual or bulk users, search/paginate members, reset passwords, delete accounts
- **Progress Tracking** — Filter task completion by project or member

### Member
- **Dashboard** — Personal task stats, completion rate, overdue alerts, 6-month activity chart
- **Task View** — View assigned tasks, update status, add notes/updates, filter by status or overdue

### Auth
- JWT-based authentication (1-day access token, 5-day refresh token)
- Email verification before first login
- Multi-device session tracking (max 5 sessions per user, auto-cleanup)
- Password reset via email
- HttpOnly, SameSite=strict cookies

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix UI |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| Tables | @tanstack/react-table |
| HTTP Client | Axios |
| Database | MongoDB (Mongoose) |
| Auth | JWT, bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| Validation | Zod |
| Logging | Winston |
| Linting | Biome |
| Testing | Playwright |

---

## Project Structure

```
src/
├── app/
│   ├── (admin)/admin/          # Admin pages (dashboard, teams, projects, tasks, users)
│   ├── (auth)/auth/            # Auth pages (login, register, verify-email)
│   ├── (member)/member/        # Member pages (dashboard, tasks)
│   └── api/                    # Next.js API routes
│       ├── auth/               # Login, logout, refresh, profile, password reset
│       ├── teams/              # Team CRUD
│       ├── projects/           # Project CRUD
│       ├── tasks/              # Task CRUD
│       ├── users/              # User management
│       ├── member/             # Member-scoped endpoints
│       ├── admin/              # Admin-scoped endpoints
│       └── dashboard/          # Dashboard data
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   └── app_component/          # Feature-specific components
├── models/                     # Mongoose schemas (User, Team, Project, Task, Session)
├── api/api.js                  # Axios API client functions
├── config/db_config.js         # MongoDB connection with global caching
├── schema/                     # Zod validation schemas
├── utils/                      # Axios instance, mailer, auth helpers
├── hooks/                      # Custom React hooks
├── logger/                     # Winston logger
└── template/                   # React Email templates
```

---

## Data Models

**User** — `username`, `email`, `full_name`, `password` (hashed), `role` (admin | member), `isAdmin`, `isverified`, `job_title`, `department`, `company`, `teamId`

**Team** — `name`, `members[]`, `createdBy`

**Project** — `name`, `description`, `teamId`, `createdBy`

**Task** — `title`, `description`, `status` (todo | in-progress | done), `assignedTo`, `projectId`, `dueDate`, `updates[]`

**Session** — `userId`, `device`, `browser`, `ip`, `location`, `isCurrent`

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login with email/username + password |
| POST | `/api/auth/register` | Register new admin user |
| POST | `/api/auth/verify_admin` | Verify email token |
| GET | `/api/auth/user_profile` | Get current user profile |
| PATCH | `/api/auth/update_profile` | Update profile |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/session` | List active sessions |
| DELETE | `/api/auth/session` | Logout one or all sessions |
| POST | `/api/auth/forget_password` | Request password reset email |
| POST | `/api/auth/reset_pass_email` | Reset password via token |

### Teams
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/teams` | List all teams |
| POST | `/api/teams` | Create team |
| PATCH | `/api/teams/[id]` | Update team |
| DELETE | `/api/teams/[id]` | Delete team |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/[id]` | Get project details |
| PATCH | `/api/projects/[id]` | Update project |
| DELETE | `/api/projects/[id]` | Delete project |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks?projectId=` | List tasks (optional project filter) |
| POST | `/api/tasks` | Create task (single or bulk team assignment) |
| PATCH | `/api/tasks/[id]` | Update task |
| DELETE | `/api/tasks/[id]` | Delete task |

### Users (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users?page=&limit=&search=` | List members (paginated) |
| POST | `/api/users` | Create user(s) — accepts single object or array |
| PATCH | `/api/users/[id]` | Update user (e.g. reset password) |
| DELETE | `/api/users/[id]` | Delete user |

### Member
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/member/dashboard` | Member dashboard stats |
| GET | `/api/member/tasks?status=` | Member's assigned tasks |
| PATCH | `/api/member/tasks/[id]` | Update task status or add note |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/progress?projectId=&memberId=` | Progress tracking |
| GET | `/api/dashboard` | Admin dashboard data |

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) — `npm install -g pnpm`
- MongoDB Atlas cluster or local MongoDB instance

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
PROD_DATABASE_URL=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# Authentication
TOKEN_SECRET=<strong-random-secret>
SESSION_SECRET=<strong-random-secret>

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-gmail>
SMTP_PASS=<gmail-app-password>
SENDER_EMAIL=<sender-address>
RECIPIENT_EMAIL=<recipient-address>

# URLs
DOMAIN_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Environment
NODE_ENV=development
```

> For Gmail SMTP, generate an [App Password](https://support.google.com/accounts/answer/185833) rather than using your account password.

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
pnpm build
pnpm start
```

### Code Quality

```bash
pnpm lint       # Biome lint check
pnpm format     # Biome auto-format
```

### Testing

```bash
npx playwright test
```

---

## User Roles

| Role | Access |
|---|---|
| `admin` | Full access to all admin pages and API routes. Must have `isAdmin: true` and a verified email to log in. Max 2 admins per company. |
| `member` | Access to member dashboard and their own tasks only. Created by admins; pre-verified on creation. |

---

## Security Notes

- Passwords are hashed with bcryptjs (10 rounds)
- JWT tokens are stored in HttpOnly, SameSite=strict cookies
- All admin API routes verify the JWT and check `role === "admin"` on every request
- Input is validated with Zod schemas before any database operation
- Sessions are capped at 5 per user; oldest are automatically removed
- Use strong, unique values for `TOKEN_SECRET` and `SESSION_SECRET` in production
