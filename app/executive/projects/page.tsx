import Link from "next/link"
import { prisma } from "@/lib/db"
import { TaskStatusBadge } from "@/components/TaskStatusBadge"

async function getProjects() {
  return prisma.project.findMany({
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

export default async function ExecutiveProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">All Projects</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Overview of all projects across the organization
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/executive/projects/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Manual Project
          </Link>
          <Link
            href="/executive/projects/new-ai"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Project Planning
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">No projects yet. Create your first project!</p>
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
