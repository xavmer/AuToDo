import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { TaskStatusBadge } from "@/components/TaskStatusBadge"

async function getProjects(userId: string, teamId: string | null) {
  return prisma.project.findMany({
    where: {
      OR: [
        { managerId: userId },
        ...(teamId ? [{ manager: { teamId } }] : []),
      ],
    },
    include: {
      createdBy: { select: { name: true } },
      manager: { select: { name: true } },
      tasks: {
        select: { id: true, status: true, assigneeUserId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export default async function ManagerProjectsPage() {
  const session = await auth()
  if (!session?.user) return null

  const projects = await getProjects(session.user.id, session.user.teamId)

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Projects</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage and track all your projects
          </p>
        </div>
        <Link
          href="/manager/projects/new-ai"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New AI Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">
            No projects yet. Create your first project!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const taskStats = project.tasks.reduce(
              (acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1
                return acc
              },
              {} as Record<string, number>
            )

            const unassignedCount = project.tasks.filter(
              (t) => !t.assigneeUserId
            ).length

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {project.title}
                </h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1 mb-4">
                  <p>Manager: <span className="text-slate-900 dark:text-white">{project.manager.name}</span></p>
                  <p>Status: <span className="text-slate-900 dark:text-white">{project.status}</span></p>
                  <p>Tasks: <span className="text-slate-900 dark:text-white">{project.tasks.length}</span></p>
                  {unassignedCount > 0 && (
                    <p className="text-orange-600 dark:text-orange-400 font-medium">
                      {unassignedCount} unassigned
                    </p>
                  )}
                </div>
                {project.tasks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(taskStats).map(([status, count]) => (
                      <span key={status} className="text-xs flex items-center gap-1">
                        <TaskStatusBadge status={status as any} /> {count}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
