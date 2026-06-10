# Web Application Demo

## Purpose
Multi-tenant project management SaaS with Kanban boards, org-level RBAC, and team collaboration.

## Archetype Coverage
SaaS Workflow — project management, task tracking, team collaboration, admin panels.

## What's Built
- Multi-tenant organizations with membership and role hierarchy (OWNER, ADMIN, MEMBER, VIEWER)
- Project management with CRUD and archive
- Task management with local TaskMachine: BACKLOG → TODO → IN_PROGRESS → IN_REVIEW → DONE
- Kanban column view of tasks with per-column transition buttons
- Task detail with comments
- Member management: add/remove members with role selection
- Activity log with causationId for all actions
- Admin panel: list all orgs and users
- Full org-level data isolation — all queries scoped by organizationId

## Architecture
- Next.js 16 App Router, Prisma + SQLite, 8 models
- @jaostudio/core/state-machines — barrel import (machine coexists with local machines)
- **Local TaskMachine** — demonstrates app-owned state machine coexisting with shared platform machines
- NextAuth v4 CredentialsProvider (same pattern, no PrismaAdapter)
- Server actions with org membership validation + role hierarchy guards

## Credentials
| Email | Role |
|---|---|
| alice@demo.dev | OWNER |
| bob@demo.dev | ADMIN |
| carol@demo.dev | MEMBER |

Password: `password123`

## Commands
```
npm run dev        # Start development server
npm run build      # Production build
npm run db:seed    # Re-seed database
```
