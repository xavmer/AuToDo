import Link from "next/link"
import { prisma } from "@/lib/db"
import { TaskStatusBadge } from "@/components/TaskStatusBadge"

async function getProjects() {
  return prisma.project.findMany({
    include: {
      createdBy: { select: { name: true } },
      manager: { select: { name: true } },
      tasks: {
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export default async function ExecutiveProjectsPage() {
  const projects = await getProjects()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">All Projects</h1>
        <div className="space-x-3">
          <Link
            href="/executive/projects/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Manual Project
          </Link>
          <Link
            href="/executive/projects/new-ai"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            AI Project Planning
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No projects yet. Create your first project!</p>
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

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {project.title}
                </h3>
                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p>Manager: {project.manager.name}</p>
                  <p>Status: {project.status}</p>
                  <p>Tasks: {project.tasks.length}</p>
                </div>
                {project.tasks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(taskStats).map(([status, count]) => (
                      <span key={status} className="text-xs">
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
