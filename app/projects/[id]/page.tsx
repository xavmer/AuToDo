"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { TaskStatusBadge } from "@/components/TaskStatusBadge"
import Link from "next/link"

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [project, setProject] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [generatingRecs, setGeneratingRecs] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadProject()
    loadRecommendations()
  }, [params.id])

  const loadProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (!response.ok) throw new Error("Failed to load project")
      const data = await response.json()
      setProject(data.project)
    } catch (err) {
      setError("Failed to load project")
    } finally {
      setLoading(false)
    }
  }

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`/api/recommendations/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations)
      }
    } catch (err) {
      console.error("Failed to load recommendations:", err)
    }
  }

  const generateRecommendations = async () => {
    setGeneratingRecs(true)
    try {
      const response = await fetch(`/api/recommendations/projects/${params.id}`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to generate recommendations")
      const data = await response.json()
      setRecommendations(data.recommendations)
    } catch (err) {
      alert("Failed to generate recommendations")
    } finally {
      setGeneratingRecs(false)
    }
  }

  const applyRecommendation = async (recId: string) => {
    try {
      const response = await fetch(`/api/recommendations/apply/${recId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Apply recommendation error:", errorData)
        throw new Error(errorData.error || "Failed to apply recommendation")
      }
      await loadProject()
      alert("Recommendation applied successfully!")
    } catch (err) {
      console.error("Apply recommendation exception:", err)
      alert(`Failed to apply recommendation: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-600">{error}</div>
  if (!project) return <div>Project not found</div>

  const unassignedTasks = project.tasks.filter((t: any) => !t.assigneeUserId)

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {project.title}
            </h1>
            <p className="text-gray-700">{project.description}</p>
            <div className="mt-4 text-sm text-gray-600 space-y-1">
              <p>Manager: {project.manager.name}</p>
              <p>Status: {project.status}</p>
              <p>Tasks: {project.tasks.length}</p>
              {unassignedTasks.length > 0 && (
                <p className="text-orange-600 font-medium">
                  {unassignedTasks.length} unassigned tasks
                </p>
              )}
            </div>
          </div>
          {project.manager && unassignedTasks.length > 0 && (
            <button
              onClick={generateRecommendations}
              disabled={generatingRecs}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {generatingRecs ? "Generating..." : "Generate Recommendations"}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Tasks</h2>
        <div className="space-y-4">
          {project.tasks.map((task: any) => {
            const taskRecs = recommendations?.find(
              (r: any) => r.taskId === task.id
            )

            return (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-lg font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {task.title}
                    </Link>
                    <p className="text-gray-700 mt-1">{task.description}</p>
                  </div>
                  <TaskStatusBadge status={task.status} />
                </div>

                <div className="text-sm text-gray-600 mt-2">
                  {task.assignee ? (
                    <p>Assigned to: {task.assignee.name}</p>
                  ) : (
                    <p className="text-orange-600">Unassigned</p>
                  )}
                  <p>Effort: {task.estimatedEffortHours}h</p>
                </div>

                {taskRecs && taskRecs.recommendations.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-semibold mb-2">
                      Recommendations:
                    </h4>
                    <div className="space-y-2">
                      {taskRecs.recommendations.slice(0, 3).map((rec: any) => (
                        <div
                          key={rec.id}
                          className="flex justify-between items-center bg-gray-50 p-3 rounded"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {rec.recommendedAssigneeType === "AI"
                                ? "AI Automation"
                                : rec.employeeName || "Employee"}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {rec.rationale}
                            </p>
                          </div>
                          {!task.assigneeUserId && (
                            <button
                              onClick={() => applyRecommendation(rec.id)}
                              className="ml-3 px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {project.channels && project.channels[0] && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Project Channel</h2>
          <div className="space-y-3 mb-4">
            {project.channels[0].messages.map((msg: any) => (
              <div key={msg.id} className="border-l-4 border-indigo-300 pl-4 py-2">
                <div className="text-sm font-medium text-gray-900">
                  {msg.sender.name}
                </div>
                <div className="text-gray-700">{msg.body}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(msg.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
