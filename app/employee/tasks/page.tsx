import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { KanbanBoard } from "@/components/KanbanBoard"

async function getMyTasks(userId: string) {
  return prisma.task.findMany({
    where: {
      assigneeUserId: userId,
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: [
      { priority: "desc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  })
}

export default async function EmployeeTasksPage() {
  const session = await auth()
  if (!session?.user) return null

  const tasks = await getMyTasks(session.user.id)

  // Transform tasks to match KanbanBoard expected format
  const transformedTasks = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    estimatedEffortHours: task.estimatedEffortHours,
    skills: task.skills || [],
    project: task.project,
  }))

  return <KanbanBoard initialTasks={transformedTasks} userName={session.user.name || "User"} />
}
