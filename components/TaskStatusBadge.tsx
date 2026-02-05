import { TaskStatus } from "@prisma/client"

const statusColors: Record<TaskStatus, string> = {
  NOT_STARTED: "bg-gray-200 text-gray-800",
  IN_PROGRESS: "bg-blue-200 text-blue-800",
  BLOCKED: "bg-red-200 text-red-800",
  NEEDS_REVIEW: "bg-yellow-200 text-yellow-800",
  DONE: "bg-green-200 text-green-800",
}

const statusLabels: Record<TaskStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  NEEDS_REVIEW: "Needs Review",
  DONE: "Done",
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[status]}`}
    >
      {statusLabels[status]}
    </span>
  )
}
