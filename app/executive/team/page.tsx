import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"

async function getAllTeamMembers() {
  const managers = await prisma.user.findMany({
    where: {
      role: "MANAGER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      teamId: true,
      managedProjects: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })

  const employees = await prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
    },
    include: {
      employeeProfile: true,
      assignedTasks: {
        where: {
          status: {
            in: ["NOT_STARTED", "IN_PROGRESS", "BLOCKED"],
          },
        },
        select: {
          id: true,
          title: true,
          estimatedEffortHours: true,
          status: true,
          project: {
            select: {
              title: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  return { managers, employees }
}

export default async function ExecutiveTeamPage() {
  const session = await auth()
  if (!session?.user) return null

  const { managers, employees } = await getAllTeamMembers()

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Company Team</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          View all managers and employees across the organization
        </p>
      </div>

      {/* Managers Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Managers
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {managers.length} manager{managers.length !== 1 ? "s" : ""} in the organization
          </p>
        </div>

        {managers.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No managers found.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {managers.map((manager) => {
              const activeProjects = manager.managedProjects.filter(
                (p) => p.status !== "COMPLETED" && p.status !== "CANCELLED"
              ).length

              return (
                <div
                  key={manager.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6"
                >
                  <Link href={`/users/${manager.id}`}>
                    <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-2 cursor-pointer">
                      {manager.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {manager.email}
                  </p>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        Role:
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                        Manager
                      </span>
                    </div>

                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        Active Projects:
                      </p>
                      <p className="text-slate-900 dark:text-white">
                        {activeProjects} project{activeProjects !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        Total Projects:
                      </p>
                      <p className="text-slate-900 dark:text-white">
                        {manager.managedProjects.length}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Employees Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Employees
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {employees.length} employee{employees.length !== 1 ? "s" : ""} in the organization
          </p>
        </div>

        {employees.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No employees found.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((employee) => {
              const currentLoad = employee.assignedTasks.reduce(
                (sum, task) => sum + task.estimatedEffortHours,
                0
              )
              const capacity = employee.employeeProfile?.capacityHoursPerWeek || 40
              const utilization = (currentLoad / capacity) * 100

              return (
                <div
                  key={employee.id}
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6"
                >
                  <Link href={`/users/${employee.id}`}>
                    <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-2 cursor-pointer">
                      {employee.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {employee.email}
                  </p>

                  {employee.employeeProfile && (
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          Seniority:
                        </p>
                        <p className="text-slate-900 dark:text-white">
                          {employee.employeeProfile.seniority}
                        </p>
                      </div>

                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Workload:
                        </p>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                utilization > 90
                                  ? "bg-red-500"
                                  : utilization > 70
                                  ? "bg-orange-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                          <span className="text-slate-700 dark:text-slate-300">
                            {utilization.toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {currentLoad}h / {capacity}h per week
                        </p>
                      </div>

                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Skills:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {Array.isArray(employee.employeeProfile.skills) &&
                            employee.employeeProfile.skills
                              .slice(0, 5)
                              .map((skill, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded"
                                >
                                  {String(skill)}
                                </span>
                              ))}
                          {Array.isArray(employee.employeeProfile.skills) &&
                            employee.employeeProfile.skills.length > 5 && (
                              <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                                +{employee.employeeProfile.skills.length - 5} more
                              </span>
                            )}
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">
                          Active Tasks: {employee.assignedTasks.length}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
