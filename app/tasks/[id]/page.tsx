"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { TaskStatusBadge } from "@/components/TaskStatusBadge"
import Link from "next/link"

const statusOptions = ["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "NEEDS_REVIEW", "DONE"]

export default function TaskDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    loadTask()
  }, [params.id])

  const loadTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`)
      if (!response.ok) throw new Error("Failed to load task")
      const data = await response.json()
      setTask(data.task)
    } catch (err) {
      setError("Failed to load task")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error("Failed to update status")
      await loadTask()
    } catch (err) {
      alert("Failed to update status")
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSendingMessage(true)
    try {
      const response = await fetch(`/api/tasks/${params.id}/thread`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newMessage }),
      })
      if (!response.ok) throw new Error("Failed to send message")
      setNewMessage("")
      await loadTask()
    } catch (err) {
      alert("Failed to send message")
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-600">{error}</div>
  if (!task) return <div>Task not found</div>

  const isEmployee = session?.user?.role === "EMPLOYEE"
  const isAssignedToMe = session?.user?.id === task.assigneeUserId

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {task.title}
            </h1>
            <Link
              href={`/projects/${task.project.id}`}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              ← Back to {task.project.title}
            </Link>
          </div>
          <TaskStatusBadge status={task.status} />
        </div>

        <div className="prose max-w-none mb-6">
          <p className="text-gray-700">{task.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <p className="font-medium text-gray-700">Assignee:</p>
            <p className="text-gray-900">
              {task.assignee ? task.assignee.name : "Unassigned"}
              {task.assigneeType === "AI" && " (AI)"}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Reviewer:</p>
            <p className="text-gray-900">
              {task.reviewer ? task.reviewer.name : "None"}
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Effort:</p>
            <p className="text-gray-900">{task.estimatedEffortHours} hours</p>
          </div>
          <div>
            <p className="font-medium text-gray-700">Priority:</p>
            <p className="text-gray-900">
              {["Low", "Medium", "High"][task.priority]}
            </p>
          </div>
        </div>

        {Array.isArray(task.skills) && task.skills.length > 0 && (
          <div className="mb-6">
            <p className="font-medium text-gray-700 mb-2">Required Skills:</p>
            <div className="flex flex-wrap gap-2">
              {task.skills.map((skill: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(task.acceptanceCriteria) &&
          task.acceptanceCriteria.length > 0 && (
            <div className="mb-6">
              <p className="font-medium text-gray-700 mb-2">
                Acceptance Criteria:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {task.acceptanceCriteria.map((criteria: string, i: number) => (
                  <li key={i}>{criteria}</li>
                ))}
              </ul>
            </div>
          )}

        {isEmployee && isAssignedToMe && (
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Status:
            </label>
            <select
              value={task.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Discussion Thread</h2>

        <div className="space-y-4 mb-6">
          {task.taskThread?.messages.length > 0 ? (
            task.taskThread.messages.map((msg: any) => (
              <div
                key={msg.id}
                className="border-l-4 border-indigo-300 pl-4 py-2"
              >
                <div className="text-sm font-medium text-gray-900">
                  {msg.sender.name}
                </div>
                <div className="text-gray-700">{msg.body}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(msg.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No messages yet.</p>
          )}
        </div>

        <form onSubmit={sendMessage} className="space-y-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Add a comment or question..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
          />
          <button
            type="submit"
            disabled={sendingMessage || !newMessage.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {sendingMessage ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  )
}
