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
      
      // Ensure task thread exists
      if (!data.task.taskThread) {
        // Task thread will be created automatically when first message is posted
        setTask({...data.task, taskThread: { messages: [] }})
      }
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
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Failed to send message:", errorData)
        throw new Error(errorData.error || "Failed to send message")
      }
      setNewMessage("")
      await loadTask()
    } catch (err) {
      console.error("Send message error:", err)
      alert(`Failed to send message: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-600 dark:text-red-400">{error}</div>
  if (!task) return <div className="text-slate-600 dark:text-slate-400">Task not found</div>

  const isEmployee = session?.user?.role === "EMPLOYEE"
  const isAssignedToMe = session?.user?.id === task.assigneeUserId

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {task.title}
              </h1>
              <Link
                href={`/projects/${task.project.id}`}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to {task.project.title}
              </Link>
            </div>
            <TaskStatusBadge status={task.status} />
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-slate-700 dark:text-slate-300">{task.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Assignee:</p>
              <p className="text-slate-900 dark:text-white">
                {task.assignee ? task.assignee.name : "Unassigned"}
                {task.assigneeType === "AI" && " (AI)"}
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Reviewer:</p>
              <p className="text-slate-900 dark:text-white">
                {task.reviewer ? task.reviewer.name : "None"}
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Effort:</p>
              <p className="text-slate-900 dark:text-white">{task.estimatedEffortHours} hours</p>
            </div>
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Priority:</p>
              <p className="text-slate-900 dark:text-white">
                {["Low", "Medium", "High"][task.priority]}
              </p>
            </div>
          </div>

          {Array.isArray(task.skills) && task.skills.length > 0 && (
            <div className="mb-6">
              <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">Required Skills:</p>
              <div className="flex flex-wrap gap-2">
                {task.skills.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded text-sm"
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
                <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Acceptance Criteria:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                {task.acceptanceCriteria.map((criteria: string, i: number) => (
                  <li key={i}>{criteria}</li>
                ))}
              </ul>
            </div>
          )}

          {task.useAI && (
            <div className="mb-6 flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-medium text-purple-900 dark:text-purple-100">
                AI-Assisted Task - Use AI tools to complete this task
              </span>
            </div>
          )}

        {isEmployee && isAssignedToMe && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Update Status:
            </label>
            <select
              value={task.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-slate-900 dark:text-white bg-white dark:bg-slate-900"
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

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Comments & Discussion
          </h2>
          <span className="ml-auto text-sm text-slate-500 dark:text-slate-400">
            {task.taskThread?.messages.length || 0} {task.taskThread?.messages.length === 1 ? 'comment' : 'comments'}
          </span>
        </div>

        <div className="space-y-4 mb-6">
          {task.taskThread?.messages.length > 0 ? (
            task.taskThread.messages.map((msg: any) => (
              <div
                key={msg.id}
                className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border-l-4 border-indigo-500 dark:border-indigo-400"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {msg.sender.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {msg.sender.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-slate-700 dark:text-slate-300 ml-10 whitespace-pre-wrap">{msg.body}</div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <svg className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-slate-500 dark:text-slate-400 text-sm">No comments yet. Start the discussion!</p>
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Add a comment
            </label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Share updates, ask questions, or provide feedback..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tip: Use @name to mention team members
            </p>
            <button
              type="submit"
              disabled={sendingMessage || !newMessage.trim()}
              className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {sendingMessage ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Post Comment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  )
}
