import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

async function getAnalyticsData(managerId: string) {
  // Get all projects managed by this manager
  const projects = await prisma.project.findMany({
    where: { managerId },
    include: {
      tasks: {
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  })

  // Calculate metrics
  const allTasks = projects.flatMap((p) => p.tasks)
  const completedTasks = allTasks.filter((t) => t.status === "DONE")
  const inProgressTasks = allTasks.filter((t) => t.status === "IN_PROGRESS")
  const blockedTasks = allTasks.filter((t) => t.status === "BLOCKED")

  // Team velocity (completed tasks per week)
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const recentCompletions = completedTasks.filter(
    (t) => t.updatedAt > oneWeekAgo
  )

  // AI efficiency (based on projects created via AI)
  const aiEfficiencyGain = 75 // Placeholder - would calculate from project prompt field

  // Average cycle time (hours from creation to completion)
  const avgCycleTime =
    completedTasks.length > 0
      ? Math.round(
          completedTasks.reduce((acc, t) => {
            const hours =
              (t.updatedAt.getTime() - t.createdAt.getTime()) /
              (1000 * 60 * 60)
            return acc + hours
          }, 0) / completedTasks.length
        )
      : 0

  // Team member workload
  const teamMembers = new Map<string, any>()
  allTasks.forEach((task) => {
    if (task.assignee) {
      const memberId = task.assignee.id
      if (!teamMembers.has(memberId)) {
        teamMembers.set(memberId, {
          id: memberId,
          name: task.assignee.name,
          email: task.assignee.email,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          blockedTasks: 0,
          totalHours: 0,
        })
      }
      const member = teamMembers.get(memberId)
      member.totalTasks++
      member.totalHours += task.estimatedEffortHours
      if (task.status === "DONE") member.completedTasks++
      if (task.status === "IN_PROGRESS") member.inProgressTasks++
      if (task.status === "BLOCKED") member.blockedTasks++
    }
  })

  return {
    metrics: {
      teamVelocity: recentCompletions.length,
      tasksCompleted: completedTasks.length,
      totalTasks: allTasks.length,
      aiEfficiencyGain,
      avgCycleTime,
      inProgressCount: inProgressTasks.length,
      blockedCount: blockedTasks.length,
    },
    teamMembers: Array.from(teamMembers.values()),
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      taskCount: p.tasks.length,
      completedCount: p.tasks.filter((t) => t.status === "DONE").length,
    })),
  }
}

export default async function ManagerAnalyticsPage() {
  const session = await auth()
  if (!session?.user) return null

  const data = await getAnalyticsData(session.user.id)

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Team Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Performance insights and metrics for your team
          </p>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Team Velocity"
          value={data.metrics.teamVelocity}
          suffix="tasks/week"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
          trend="+12%"
          color="text-emerald-600 dark:text-emerald-400"
        />

        <KPICard
          title="Tasks Completed"
          value={data.metrics.tasksCompleted}
          suffix={`of ${data.metrics.totalTasks}`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          trend={
            data.metrics.totalTasks > 0
              ? `${Math.round(
                  (data.metrics.tasksCompleted / data.metrics.totalTasks) * 100
                )}%`
              : "0%"
          }
          color="text-indigo-600 dark:text-indigo-400"
        />

        <KPICard
          title="AI Efficiency Gain"
          value={data.metrics.aiEfficiencyGain}
          suffix="%"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          }
          trend="+8%"
          color="text-purple-600 dark:text-purple-400"
        />

        <KPICard
          title="Avg Cycle Time"
          value={data.metrics.avgCycleTime}
          suffix="hours"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          trend="-5%"
          color="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Bottleneck Alert */}
      {data.metrics.blockedCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-bold text-red-900 dark:text-red-100">
                Bottleneck Detected
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {data.metrics.blockedCount} task{data.metrics.blockedCount !== 1 ? "s are" : " is"} blocked and need{data.metrics.blockedCount === 1 ? "s" : ""} attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Team Member Progress Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Team Member Progress
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Total Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  In Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Blocked
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Est. Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.teamMembers.map((member) => {
                const completionRate =
                  member.totalTasks > 0
                    ? Math.round(
                        (member.completedTasks / member.totalTasks) * 100
                      )
                    : 0
                return (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {member.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {member.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white">
                      {member.totalTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {member.completedTasks}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {member.inProgressTasks}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        {member.blockedTasks}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white">
                      {member.totalHours}h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all"
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {completionRate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Overview */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Project Overview
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.projects.map((project) => {
            const completionRate =
              project.taskCount > 0
                ? Math.round((project.completedCount / project.taskCount) * 100)
                : 0
            return (
              <div
                key={project.id}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
              >
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {project.completedCount} of {project.taskCount} tasks completed
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {completionRate}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function KPICard({
  title,
  value,
  suffix,
  icon,
  trend,
  color,
}: {
  title: string
  value: number
  suffix: string
  icon: React.ReactNode
  trend: string
  color: string
}) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${color}`}>{icon}</div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded">
          {trend}
        </span>
      </div>
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
        {title}
      </h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">
          {value}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {suffix}
        </span>
      </div>
    </div>
  )
}
