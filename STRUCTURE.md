# Workplace MVP - Complete File Structure

\`\`\`
workplace-mvp/
│
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind CSS configuration
├── postcss.config.js               # PostCSS configuration
├── jest.config.js                  # Jest testing configuration
├── .env.example                    # Environment variables template
├── .gitignore                      # Git ignore rules
├── README.md                       # Complete documentation with RUNNING LOCALLY guide
│
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root layout with SessionProvider
│   ├── page.tsx                    # Home page (redirects by role)
│   ├── globals.css                 # Global styles with Tailwind
│   ├── login/
│   │   └── page.tsx               # Login page with credentials form
│   │
│   ├── api/                        # API Routes (all with RBAC)
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts       # NextAuth handlers
│   │   ├── projects/
│   │   │   ├── route.ts           # GET (role-filtered), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts       # GET project detail
│   │   │       ├── tasks/
│   │   │       │   └── route.ts   # POST create task
│   │   │       └── messages/
│   │   │           └── route.ts   # GET/POST project channel messages
│   │   ├── tasks/
│   │   │   ├── my/
│   │   │   │   └── route.ts       # GET employee's tasks
│   │   │   └── [id]/
│   │   │       ├── route.ts       # GET/PATCH task (status, assignment)
│   │   │       └── thread/
│   │   │           └── route.ts   # GET/POST task thread messages
│   │   ├── ai/
│   │   │   ├── plan/
│   │   │   │   └── route.ts       # POST generate AI plan
│   │   │   └── approve-plan/
│   │   │       └── route.ts       # POST create project from AI plan
│   │   ├── recommendations/
│   │   │   ├── projects/
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts   # GET/POST recommendations
│   │   │   └── apply/
│   │   │       └── [id]/
│   │   │           └── route.ts   # POST apply recommendation
│   │   ├── notifications/
│   │   │   ├── my/
│   │   │   │   └── route.ts       # GET user notifications
│   │   │   └── [id]/
│   │   │       └── route.ts       # PATCH mark as read
│   │   └── users/
│   │       └── managers/
│   │           └── route.ts       # GET all managers
│   │
│   ├── executive/                  # Executive Dashboard
│   │   ├── layout.tsx             # Executive layout with navbar
│   │   └── projects/
│   │       ├── page.tsx           # All projects list
│   │       └── new-ai/
│   │           ├── page.tsx       # AI prompt input
│   │           └── preview/
│   │               └── page.tsx   # Review and approve AI plan
│   │
│   ├── manager/                    # Manager Dashboard
│   │   ├── layout.tsx             # Manager layout with navbar
│   │   ├── projects/
│   │   │   ├── page.tsx           # Manager projects list
│   │   │   └── new-ai/
│   │   │       ├── page.tsx       # AI prompt input
│   │   │       └── preview/
│   │   │           └── page.tsx   # Review and approve AI plan
│   │   └── team/
│   │       └── page.tsx           # Team members & workload
│   │
│   ├── employee/                   # Employee Dashboard
│   │   ├── layout.tsx             # Employee layout with navbar
│   │   └── tasks/
│   │       └── page.tsx           # Task inbox
│   │
│   ├── projects/                   # Shared Project Views
│   │   └── [id]/
│   │       └── page.tsx           # Project detail with tasks & recommendations
│   │
│   └── tasks/                      # Shared Task Views
│       └── [id]/
│           └── page.tsx           # Task detail with thread
│
├── components/                     # Shared React Components
│   ├── Providers.tsx              # SessionProvider wrapper
│   ├── Navbar.tsx                 # Navigation bar with role-based links
│   ├── TaskStatusBadge.tsx        # Status badge component
│   └── LoadingSpinner.tsx         # Loading indicator
│
├── lib/                            # Utility Libraries
│   ├── auth.ts                    # NextAuth configuration
│   ├── rbac.ts                    # RBAC: requireRole, assertProjectAccess, assertTaskAccess
│   ├── db.ts                      # Prisma client singleton
│   ├── notifications.ts           # createNotification, parseMentions
│   ├── activity.ts                # logActivity, getActivityLogs
│   ├── socket.ts                  # Socket.io server setup
│   ├── socket-client.ts           # Socket.io client hooks
│   ├── ai/
│   │   └── plan.ts               # AI planning with Zod validation & retry
│   └── scoring/
│       └── recommend.ts          # Recommendation engine with scoring
│
├── prisma/
│   ├── schema.prisma              # Complete database schema
│   └── seed.ts                    # Seed script (1 exec, 1 manager, 3 employees)
│
└── __tests__/                      # Test Files
    ├── scoring.test.ts            # Recommendation scoring tests
    └── rbac.test.ts               # RBAC access control tests
\`\`\`

## Key Files by Feature

### Phase 1: Core App Skeleton
- Prisma schema: \`prisma/schema.prisma\`
- Auth: \`lib/auth.ts\`, \`app/api/auth/[...nextauth]/route.ts\`
- RBAC: \`lib/rbac.ts\`
- API routes: \`app/api/projects/\`, \`app/api/tasks/\`
- UI: \`app/executive/\`, \`app/manager/\`, \`app/employee/\`
- Seed: \`prisma/seed.ts\`

### Phase 2: AI Planning
- AI module: \`lib/ai/plan.ts\`
- API: \`app/api/ai/plan/route.ts\`, \`app/api/ai/approve-plan/route.ts\`
- UI: \`app/executive/projects/new-ai/\`, \`app/manager/projects/new-ai/\`

### Phase 3: Recommendations
- Scoring engine: \`lib/scoring/recommend.ts\`
- API: \`app/api/recommendations/\`
- UI: \`app/projects/[id]/page.tsx\` (shows recommendations)
- Team view: \`app/manager/team/page.tsx\`

### Supporting Infrastructure
- Real-time: \`lib/socket.ts\`, \`lib/socket-client.ts\`
- Notifications: \`lib/notifications.ts\`, \`app/api/notifications/\`
- Activity logs: \`lib/activity.ts\`
- Tests: \`__tests__/scoring.test.ts\`, \`__tests__/rbac.test.ts\`

## Database Models (11 total)

1. **User** - Authentication and role
2. **Team** - User grouping
3. **EmployeeProfile** - Skills, capacity, seniority, preferences
4. **Project** - High-level container
5. **Task** - Work items with all required fields
6. **TaskRecommendation** - Scored suggestions with rationale
7. **Channel** - Project message channels
8. **Message** - Channel messages
9. **TaskThread** - Per-task threads
10. **ThreadMessage** - Thread messages
11. **ActivityLog** - Audit trail
12. **Notification** - User alerts

## API Routes (20 total)

### Auth
- POST /api/auth/[...nextauth]

### Projects
- GET /api/projects (role-filtered)
- POST /api/projects
- GET /api/projects/[id]
- POST /api/projects/[id]/tasks
- GET /api/projects/[id]/messages
- POST /api/projects/[id]/messages

### Tasks
- GET /api/tasks/my
- GET /api/tasks/[id]
- PATCH /api/tasks/[id]
- GET /api/tasks/[id]/thread
- POST /api/tasks/[id]/thread

### AI
- POST /api/ai/plan
- POST /api/ai/approve-plan

### Recommendations
- GET /api/recommendations/projects/[id]
- POST /api/recommendations/projects/[id]
- POST /api/recommendations/apply/[id]

### Notifications
- GET /api/notifications/my
- PATCH /api/notifications/[id]

### Users
- GET /api/users/managers

## Total File Count: ~60 files

- TypeScript/TSX files: ~45
- Configuration files: ~7
- Documentation: ~2
- Tests: ~2
- Other: ~4
