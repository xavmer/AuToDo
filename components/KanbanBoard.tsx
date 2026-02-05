"use client"

import { useState } from "react"
import Link from "next/link"

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: number
  estimatedEffortHours: number
  skills: string[]
  project: {
    id: string
    title: string
  }
}

interface KanbanBoardProps {
  initialTasks: Task[]
  userName: string
}

export function KanbanBoard({ initialTasks, userName }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error("Failed to update task")
      
      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      )
    } catch (err) {
      console.error("Failed to update task status:", err)
      alert("Failed to update task status")
    }
  }

  const tasksByStatus = {
    TODO: tasks.filter((t) => t.status === "NOT_STARTED"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    REVIEW: tasks.filter(
      (t) => t.status === "NEEDS_REVIEW" || t.status === "BLOCKED"
    ),
    DONE: tasks.filter((t) => t.status === "DONE"),
  }

  const completedCount = tasksByStatus.DONE.length
  const totalCount = tasks.length
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const greeting = new Date().getHours() < 12 ? "Morning" : "Afternoon"
  const firstName = userName.split(" ")[0]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-slate-900 dark:text-white text-3xl font-black tracking-tight">
              Good {greeting}, {firstName}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              You have{" "}
              <span className="text-slate-900 dark:text-white font-bold">
                {tasks.length - completedCount} tasks
              </span>{" "}
              to review today.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg">
              <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-slate-900 dark:text-white text-sm font-bold">
                {completedCount}/{totalCount} Tasks
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg">
              <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-slate-900 dark:text-white text-sm font-bold">
                {completionRate}%
              </span>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 gap-8">
          <button className="flex items-center gap-2 border-b-2 border-indigo-600 text-slate-900 dark:text-white pb-3 pt-2 px-1 text-sm font-bold tracking-wide">
            Board View
          </button>
          <button className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white pb-3 pt-2 px-1 text-sm font-bold tracking-wide transition-all">
            List View
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-1 overflow-x-auto p-8 gap-6 items-start bg-slate-50 dark:bg-slate-900">
        <KanbanColumn
          title="To-Do"
          count={tasksByStatus.TODO.length}
          color="bg-slate-400"
          tasks={tasksByStatus.TODO}
          onStatusChange={updateTaskStatus}
        />

        <KanbanColumn
          title="In Progress"
          count={tasksByStatus.IN_PROGRESS.length}
          color="bg-indigo-600 animate-pulse"
          tasks={tasksByStatus.IN_PROGRESS}
          onStatusChange={updateTaskStatus}
          isActive
        />

        <KanbanColumn
          title="Review"
          count={tasksByStatus.REVIEW.length}
          color="bg-amber-400"
          tasks={tasksByStatus.REVIEW}
          onStatusChange={updateTaskStatus}
        />

        <KanbanColumn
          title="Done"
          count={tasksByStatus.DONE.length}
          color="bg-emerald-500"
          tasks={tasksByStatus.DONE}
          onStatusChange={updateTaskStatus}
          isDone
        />
      </div>
    </div>
  )
}

function KanbanColumn({
  title,
  count,
  color,
  tasks,
  onStatusChange,
  isActive = false,
  isDone = false,
}: {
  title: string
  count: number
  color: string
  tasks: Task[]
  onStatusChange: (taskId: string, status: string) => void
  isActive?: boolean
  isDone?: boolean
}) {
  return (
    <div
      className="flex flex-col gap-4 shrink-0"
      style={{ minWidth: "320px", maxWidth: "320px" }}
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${color}`}></span>
          <h3 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-widest">
            {title}
          </h3>
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={onStatusChange}
            isActive={isActive}
            isDone={isDone}
          />
        ))}

        {tasks.length === 0 && (
          <div className="bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-500 text-sm">No tasks here</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TaskCard({
  task,
  onStatusChange,
  isActive = false,
  isDone = false,
}: {
  task: Task
  onStatusChange: (taskId: string, status: string) => void
  isActive?: boolean
  isDone?: boolean
}) {
  const priorityColors = ["slate", "yellow", "red"]
  const priorityLabels = ["Low", "Medium", "High"]
  const priority = task.priority || 0

  const statusOptions = [
    { value: "NOT_STARTED", label: "To-Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "NEEDS_REVIEW", label: "Review" },
    { value: "DONE", label: "Done" },
  ]

  return (
    <div
      className={`bg-white dark:bg-slate-800 border ${
        isActive
          ? "ring-2 ring-indigo-600 border-transparent shadow-lg"
          : "border-slate-200 dark:border-slate-700"
      } rounded-xl p-4 flex flex-col gap-3 hover:border-indigo-500 hover:shadow-md transition-all ${
        isDone ? "opacity-60 hover:opacity-100" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <span
          className={`bg-${priorityColors[priority]}-100 dark:bg-${priorityColors[priority]}-900/30 text-${priorityColors[priority]}-700 dark:text-${priorityColors[priority]}-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider`}
        >
          {priorityLabels[priority]}
        </span>
      </div>

      <Link href={`/tasks/${task.id}`}>
        <h4
          className={`text-slate-900 dark:text-white font-bold leading-snug hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer ${
            isDone ? "line-through decoration-slate-400" : ""
          }`}
        >
          {task.title}
        </h4>
      </Link>

      {task.description && (
        <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <span className="truncate">{task.project?.title}</span>
      </div>

      {Array.isArray(task.skills) && task.skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.skills.slice(0, 3).map((skill: string, i: number) => (
            <span
              key={i}
              className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded"
            >
              {skill}
            </span>
          ))}
          {task.skills.length > 3 && (
            <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded">
              +{task.skills.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{task.estimatedEffortHours}h</span>
        </div>

        <select
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.preventDefault()
            onStatusChange(task.id, e.target.value)
          }}
          value={task.status}
          className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-none rounded px-2 py-1 cursor-pointer hover:bg-indigo-600 hover:text-white transition-colors"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
