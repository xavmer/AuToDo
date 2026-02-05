import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>

      {members.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No team members found.</p>
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
              <div key={member.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {member.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{member.email}</p>

                {member.employeeProfile && (
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Seniority:</p>
                      <p className="text-gray-900">
                        {member.employeeProfile.seniority}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700">Workload:</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              utilization > 90
                                ? "bg-red-500"
                                : utilization > 70
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-700">
                          {utilization.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {currentLoad}h / {capacity}h per week
                      </p>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700 mb-1">Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(member.employeeProfile.skills) &&
                          member.employeeProfile.skills
                            .slice(0, 5)
                            .map((skill: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                      </div>
                    </div>

                    <div>
                      <p className="font-medium text-gray-700">
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
