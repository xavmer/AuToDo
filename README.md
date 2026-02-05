# Workplace MVP

A Slack-style project and task management platform with AI-assisted project decomposition and intelligent task assignment recommendations.

## Features

### Core Functionality
- **Role-Based Access Control (RBAC)**: Server-side enforcement for Executive, Manager, and Employee roles
- **AI Project Planning**: Generate project plans from natural language prompts using OpenAI GPT-4
- **Smart Task Assignment**: ML-ready recommendation engine that scores employees based on:
  - Skill overlap
  - Current capacity/workload
  - Seniority match
- **Real-time Messaging**: Project channels and per-task discussion threads with Socket.io
- **Notifications**: Assignment alerts, @mentions, and status change notifications
- **Activity Logging**: Comprehensive audit trail for ML training data

### Role-Specific Interfaces

#### Executive
- View all projects across the organization
- Create projects via AI prompts or manual entry
- Review and approve AI-generated project plans
- Monitor company-wide project health

#### Manager
- View team projects and workload
- Create AI-assisted projects
- Generate assignment recommendations
- Apply recommendations with one click
- Manage employee profiles (skills, capacity, seniority)
- Reassign tasks and update project status

#### Employee
- Personal task inbox with priority sorting
- Update task status
- Participate in task discussion threads
- View task requirements and acceptance criteria

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: NextAuth.js with credentials provider
- **Real-time**: Socket.io
- **AI**: OpenAI GPT-4 with Zod schema validation
- **Testing**: Jest

## RUNNING LOCALLY

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- OpenAI API key (optional - will use stub responses if not provided)

### Step 1: Clone and Install

\`\`\`bash
cd /tmp/workplace-mvp
npm install
\`\`\`

### Step 2: Setup Environment Variables

Copy the example environment file and configure:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your values:

\`\`\`env
# Database - Use your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/workplace?schema=public"

# NextAuth - Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-your-api-key-here"
\`\`\`

**Note**: If you don't have an OpenAI API key, the app will still work with stub AI responses.

### Step 3: Setup Database

Initialize the database and run migrations:

\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

### Step 4: Seed Database

Load sample data (1 exec, 1 manager, 3 employees with skills):

\`\`\`bash
npm run db:seed
\`\`\`

This creates the following demo accounts (password: `password123`):
- **Executive**: exec@workplace.com
- **Manager**: manager@workplace.com
- **Employees**: 
  - alice@workplace.com (Senior - React, TypeScript, Node.js, PostgreSQL)
  - bob@workplace.com (Mid - Python, FastAPI, Docker, Kubernetes, AWS)
  - charlie@workplace.com (Junior - JavaScript, HTML, CSS, React)

### Step 5: Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The app will be available at **http://localhost:3000**

### Step 6: Login and Explore

1. Navigate to http://localhost:3000
2. Login with any of the demo accounts
3. **Executive**: Try "AI Project Planning" to generate a project from a prompt
4. **Manager**: Generate recommendations for unassigned tasks
5. **Employee**: View and update tasks in your inbox

## Project Structure

\`\`\`
workplace-mvp/
├── app/
│   ├── api/                     # API routes
│   │   ├── auth/               # NextAuth endpoints
│   │   ├── projects/           # Project CRUD
│   │   ├── tasks/              # Task CRUD
│   │   ├── ai/                 # AI planning endpoints
│   │   ├── recommendations/    # Assignment recommendations
│   │   ├── notifications/      # Notification endpoints
│   │   └── users/              # User management
│   ├── executive/              # Executive dashboard
│   ├── manager/                # Manager dashboard
│   ├── employee/               # Employee dashboard
│   ├── projects/[id]/          # Project detail (shared)
│   ├── tasks/[id]/             # Task detail (shared)
│   ├── login/                  # Login page
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home redirect
├── components/                  # Shared React components
│   ├── Navbar.tsx
│   ├── TaskStatusBadge.tsx
│   └── LoadingSpinner.tsx
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── rbac.ts                 # Role-based access control
│   ├── db.ts                   # Prisma client
│   ├── notifications.ts        # Notification utilities
│   ├── activity.ts             # Activity logging
│   ├── socket.ts               # Socket.io server
│   ├── socket-client.ts        # Socket.io client hooks
│   ├── ai/
│   │   └── plan.ts            # AI project planning with Zod
│   └── scoring/
│       └── recommend.ts       # Recommendation scoring engine
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed script
├── __tests__/                  # Test files
│   ├── scoring.test.ts
│   └── rbac.test.ts
└── package.json
\`\`\`

## Key Implementation Details

### RBAC Enforcement

Every API route enforces access control:
- \`requireRole([roles])\` - Require user to have one of specified roles
- \`assertProjectAccess()\` - Check project-specific permissions
- \`assertTaskAccess()\` - Check task-specific permissions

Example:
\`\`\`typescript
const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER])
await assertProjectAccess(user.id, user.role, projectId, user.teamId)
\`\`\`

### AI Planning with Typed Schemas

All LLM outputs are validated with Zod schemas:
\`\`\`typescript
const TaskPlanSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  acceptanceCriteria: z.array(z.string()).min(1),
  skills: z.array(z.string()).min(1),
  estimatedEffortHours: z.number().max(8).min(0.5),
  dependencies: z.array(z.string()).default([]),
  suggestedAssigneeType: z.enum(["employee", "ai"]),
  suggestedReviewerRole: z.string().default("manager"),
})
\`\`\`

If validation fails, the system automatically retries once with a "fix to schema" prompt.

### Recommendation Scoring

The scoring algorithm considers:
1. **Skill Overlap** (50% weight): Intersection of task skills and employee skills
2. **Capacity** (30% weight): Available hours vs. task effort
3. **Seniority Match** (20% weight): Task complexity vs. employee level

All recommendations are logged with rationale for future ML training:
\`\`\`typescript
{
  scoreJson: {
    skillOverlapScore: 0.8,
    capacityScore: 0.9,
    seniorityScore: 1.0,
    totalScore: 0.86,
    skillsMatched: ["React", "TypeScript"],
    skillsMissing: []
  },
  rationale: "Rank #1 candidate: Alice Engineer. Overall score: 86%. Matching skills: React, TypeScript..."
}
\`\`\`

### Task Requirements

Every task must have:
- Title and description
- Acceptance criteria (array)
- Required skills (array)
- Estimated effort ≤ 8 hours
- Dependencies (array of task IDs)
- Suggested assignee type (employee | ai)
- Suggested reviewer role

### Notification System

Notifications are triggered on:
- Task assignment
- @mentions in messages
- Task status changes

Example mention parsing:
\`\`\`typescript
const mentionedUserIds = parseMentions("Hey @Alice can you review this?", allUsers)
// Returns: ["alice-user-id"]
\`\`\`

## Database Schema

Key entities:
- **User**: Auth + role information
- **Team**: User grouping
- **EmployeeProfile**: Skills, capacity, seniority, preferences
- **Project**: High-level project container
- **Task**: Work items with skills, acceptance criteria, dependencies
- **TaskRecommendation**: Scored assignment suggestions with rationale
- **Channel**: Project-level message channel
- **Message**: Channel messages
- **TaskThread**: Per-task discussion thread
- **ThreadMessage**: Thread messages
- **ActivityLog**: Audit trail for all actions
- **Notification**: User notifications

## Testing

Run tests:
\`\`\`bash
npm test
\`\`\`

Tests cover:
- Recommendation scoring algorithm
- RBAC access control rules
- Skill matching logic
- Capacity calculations

## Troubleshooting

### Database Connection Issues
\`\`\`bash
# Check PostgreSQL is running
psql -U postgres

# Recreate database
npm run db:push
npm run db:seed
\`\`\`

### OpenAI API Issues
If you see "OPENAI_API_KEY not set", the app will use stub responses. This is fine for development.

### Port Already in Use
Change the port in package.json:
\`\`\`json
"dev": "next dev -p 3001"
\`\`\`

## Development Tools

\`\`\`bash
# View database in browser
npm run db:studio

# Reset database
npx prisma db push --force-reset
npm run db:seed

# Generate Prisma client after schema changes
npx prisma generate
\`\`\`

## Future Enhancements (Not in MVP)

- AI agent execution (Phase 4 - not implemented)
- WebSocket for live updates (Socket.io is set up but not fully integrated)
- Employee profile editing UI
- Project analytics dashboard
- Task dependencies visualization
- Mobile responsive improvements
- File attachments
- Calendar view for tasks

## License

MIT

## Support

For issues, please check:
1. All environment variables are set correctly
2. PostgreSQL is running
3. Database is seeded
4. Node.js version is 18+

---

**Built with ❤️ using Next.js, Prisma, and OpenAI**
