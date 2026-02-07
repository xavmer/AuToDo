import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"

async function getExecutiveAnalyticsData() {
  // Get all projects
  const projects = await prisma.project.findMany({
    include: {
      manager: {
        select: { id: true, name: true, email: true, teamId: true },
      },
      tasks: {
        include: {
          assignee: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      },
    },
  })

  // Calculate overall metrics
  const allTasks = projects.flatMap((p) => p.tasks)
  const completedTasks = allTasks.filter((t) => t.status === "DONE")
  const inProgressTasks = allTasks.filter((t) => t.status === "IN_PROGRESS")
  const blockedTasks = allTasks.filter((t) => t.status === "BLOCKED")

  // Company velocity (completed tasks per week)
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const recentCompletions = completedTasks.filter(
    (t) => t.updatedAt > oneWeekAgo
  )

  // AI efficiency (based on projects created via AI)
  const aiEfficiencyGain = 75 // Placeholder

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

  // Managers metrics
  const managers = new Map<string, any>()
  projects.forEach((project) => {
    const managerId = project.manager.id
    if (!managers.has(managerId)) {
      managers.set(managerId, {
        id: managerId,
        name: project.manager.name,
        email: project.manager.email,
        role: "MANAGER",
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        blockedTasks: 0,
        totalHours: 0,
        projectCount: 0,
      })
    }
    const manager = managers.get(managerId)
    manager.projectCount++
    project.tasks.forEach((task) => {
      manager.totalTasks++
      manager.totalHours += task.estimatedEffortHours
      if (task.status === "DONE") manager.completedTasks++
      if (task.status === "IN_PROGRESS") manager.inProgressTasks++
      if (task.status === "BLOCKED") manager.blockedTasks++
    })
  })

  // Employee metrics
  const employees = new Map<string, any>()
  allTasks.forEach((task) => {
    if (task.assignee && task.assignee.role === "EMPLOYEE") {
      const empId = task.assignee.id
      if (!employees.has(empId)) {
        employees.set(empId, {
          id: empId,
          name: task.assignee.name,
          email: task.assignee.email,
          role: "EMPLOYEE",
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          blockedTasks: 0,
          totalHours: 0,
        })
      }
      const emp = employees.get(empId)
      emp.totalTasks++
      emp.totalHours += task.estimatedEffortHours
      if (task.status === "DONE") emp.completedTasks++
      if (task.status === "IN_PROGRESS") emp.inProgressTasks++
      if (task.status === "BLOCKED") emp.blockedTasks++
    }
  })

  return {
    metrics: {
      companyVelocity: recentCompletions.length,
      tasksCompleted: completedTasks.length,
      totalTasks: allTasks.length,
      aiEfficiencyGain,
      avgCycleTime,
      inProgressCount: inProgressTasks.length,
      blockedCount: blockedTasks.length,
      projectCount: projects.length,
    },
    managers: Array.from(managers.values()),
    employees: Array.from(employees.values()),
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      taskCount: p.tasks.length,
      completedCount: p.tasks.filter((t) => t.status === "DONE").length,
      managerName: p.manager.name,
    })),
  }
}

export default async function ExecutiveAnalyticsPage() {
  const session = await auth()
  if (!session?.user) return null

  const data = await getExecutiveAnalyticsData()

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Company Analytics
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Organization-wide performance insights and metrics
          </p>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Company Velocity"
          value={data.metrics.companyVelocity}
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
          title="Active Projects"
          value={data.metrics.projectCount}
          suffix="projects"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
          trend="+5"
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
                Company-Wide Bottleneck
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {data.metrics.blockedCount} task{data.metrics.blockedCount !== 1 ? "s are" : " is"} blocked and need{data.metrics.blockedCount === 1 ? "s" : ""} attention
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Managers Progress Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Manager Performance
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Projects
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
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {data.managers.map((manager) => {
                const completionRate =
                  manager.totalTasks > 0
                    ? Math.round(
                        (manager.completedTasks / manager.totalTasks) * 100
                      )
                    : 0
                return (
                  <tr
                    key={manager.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/users/${manager.id}`} className="block hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded px-2 py-1 -mx-2 -my-1 transition-colors">
                        <div className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                          {manager.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {manager.email}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white">
                      {manager.projectCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white">
                      {manager.totalTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {manager.completedTasks}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {manager.inProgressTasks}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        {manager.blockedTasks}
                      </span>
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

      {/* Employees Progress Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Employee Performance
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Employee
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
              {data.employees.map((employee) => {
                const completionRate =
                  employee.totalTasks > 0
                    ? Math.round(
                        (employee.completedTasks / employee.totalTasks) * 100
                      )
                    : 0
                return (
                  <tr
                    key={employee.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/users/${employee.id}`} className="block hover:bg-slate-100 dark:hover:bg-slate-700/70 rounded px-2 py-1 -mx-2 -my-1 transition-colors">
                        <div className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">
                          {employee.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {employee.email}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white">
                      {employee.totalTasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {employee.completedTasks}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {employee.inProgressTasks}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-red-600 dark:text-red-400 font-bold">
                        {employee.blockedTasks}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900 dark:text-white">
                      {employee.totalHours}h
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
            All Projects Overview
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.projects.map((project) => {
            const completionRate =
              project.taskCount > 0
                ? Math.round((project.completedCount / project.taskCount) * 100)
                : 0
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                  {project.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Managed by {project.managerName}
                </p>
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
              </Link>
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
