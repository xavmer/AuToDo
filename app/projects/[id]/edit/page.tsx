"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import Link from "next/link"

export default function ProjectEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  
  const [project, setProject] = useState<any>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [tasks, setTasks] = useState<any[]>([])

  useEffect(() => {
    loadProject()
  }, [params.id])

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (!response.ok) throw new Error("Failed to load project")
      const data = await response.json()
      setProject(data.project)
      setTitle(data.project.title)
      setDescription(data.project.description || "")
      setTasks(data.project.tasks || [])
    } catch (err) {
      setError("Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")

    try {
      // Update project details
      const projectResponse = await fetch(`/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      })

      if (!projectResponse.ok) {
        throw new Error("Failed to update project")
      }

      // Update tasks (create new ones, update existing, delete removed)
      for (const task of tasks) {
        if (task.id) {
          // Update existing task
          await fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: task.title,
              description: task.description,
              estimatedEffortHours: task.estimatedEffortHours,
              skills: task.skills,
              acceptanceCriteria: task.acceptanceCriteria,
            }),
          })
        } else {
          // Create new task
          await fetch(`/api/projects/${params.id}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: task.title,
              description: task.description,
              estimatedEffortHours: task.estimatedEffortHours || 4,
              skills: task.skills || [],
              acceptanceCriteria: task.acceptanceCriteria || ["Task completed"],
              dependencies: [],
              suggestedAssigneeType: "EMPLOYEE",
            }),
          })
        }
      }

      router.push(`/projects/${params.id}`)
    } catch (err: any) {
      setError(err.message || "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        title: "",
        description: "",
        estimatedEffortHours: 4,
        skills: [],
        acceptanceCriteria: ["Task completed"],
      },
    ])
  }

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  const updateTask = (index: number, field: string, value: any) => {
    const updated = [...tasks]
    updated[index] = { ...updated[index], [field]: value }
    setTasks(updated)
  }

  const updateTaskArray = (index: number, field: string, value: string) => {
    const updated = [...tasks]
    updated[index] = {
      ...updated[index],
      [field]: value.split(",").map((s) => s.trim()).filter(Boolean),
    }
    setTasks(updated)
  }

  if (loading) return <LoadingSpinner />
  if (!project) return <div className="text-red-600">Project not found</div>

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Edit Project
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Update project details and manage tasks
            </p>
          </div>
          <Link
            href={`/projects/${params.id}`}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            Cancel
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Project Details Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Project Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
                placeholder="Project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
                placeholder="Project description"
              />
            </div>
          </div>
        </div>

        {/* Tasks Management Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Tasks ({tasks.length})
            </h2>
            <button
              onClick={addTask}
              className="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
            >
              + Add Task
            </button>
          </div>

          <div className="space-y-4">
            {tasks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">
                  No tasks yet. Click "Add Task" to create one.
                </p>
              </div>
            ) : (
              tasks.map((task, index) => (
                <div
                  key={index}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50 space-y-3"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(index, "title", e.target.value)}
                        placeholder="Task title *"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                      <textarea
                        value={task.description}
                        onChange={(e) => updateTask(index, "description", e.target.value)}
                        placeholder="Task description"
                        rows={2}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                            Effort (hours)
                          </label>
                          <input
                            type="number"
                            value={task.estimatedEffortHours}
                            onChange={(e) =>
                              updateTask(index, "estimatedEffortHours", parseFloat(e.target.value))
                            }
                            min="0.5"
                            max="8"
                            step="0.5"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                            Skills (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={Array.isArray(task.skills) ? task.skills.join(", ") : ""}
                            onChange={(e) => updateTaskArray(index, "skills", e.target.value)}
                            placeholder="React, TypeScript"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                            Acceptance Criteria (comma-separated)
                          </label>
                          <input
                            type="text"
                            value={
                              Array.isArray(task.acceptanceCriteria)
                                ? task.acceptanceCriteria.join(", ")
                                : ""
                            }
                            onChange={(e) =>
                              updateTaskArray(index, "acceptanceCriteria", e.target.value)
                            }
                            placeholder="Unit tests pass, Code reviewed"
                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeTask(index)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Remove task"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link
            href={`/projects/${params.id}`}
            className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving || !title}
            className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
