import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"

async function getTeamMembers(teamId: string | null) {
  if (!teamId) return []

  return prisma.user.findMany({
    where: {
      teamId,
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
}

export default async function ManagerTeamPage() {
  const session = await auth()
  if (!session?.user) return null

  const members = await getTeamMembers(session.user.teamId)

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team Members</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          View and manage your team's workload and skills
        </p>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400">No team members found.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const currentLoad = member.assignedTasks.reduce(
              (sum, task) => sum + task.estimatedEffortHours,
              0
            )
            const capacity = member.employeeProfile?.capacityHoursPerWeek || 40
            const utilization = (currentLoad / capacity) * 100

            return (
              <div key={member.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
                <Link href={`/users/${member.id}`}>
                  <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-2 cursor-pointer">
                    {member.name}
                  </h3>
                </Link>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{member.email}</p>

                {member.employeeProfile && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">Seniority:</p>
                      <p className="text-slate-900 dark:text-white">
                        {member.employeeProfile.seniority}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">Workload:</p>
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
                      <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(member.employeeProfile.skills) &&
                          member.employeeProfile.skills
                            .slice(0, 5)
                            .map((skill: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        Active Tasks: {member.assignedTasks.length}
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
  )
}
