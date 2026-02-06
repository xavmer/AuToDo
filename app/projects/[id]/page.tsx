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
    } catch (err) {
      console.error("Apply recommendation exception:", err)
      alert(`Failed to apply recommendation: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const unassignTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to unassign this task?")) return
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeUserId: null, assigneeType: null }),
      })
      if (!response.ok) throw new Error("Failed to unassign task")
      await loadProject()
      await loadRecommendations()
    } catch (err) {
      alert(`Failed to unassign task: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-600 dark:text-red-400">{error}</div>
  if (!project) return <div className="text-slate-600 dark:text-slate-400">Project not found</div>

  const unassignedTasks = project.tasks.filter((t: any) => !t.assigneeUserId)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Project Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {project.title}
              </h1>
              <p className="text-slate-700 dark:text-slate-300">{project.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-slate-600 dark:text-slate-400">Manager: <Link href={`/users/${project.manager.id}`} className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">{project.manager.name}</Link></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-slate-600 dark:text-slate-400">Status: <span className="font-medium text-slate-900 dark:text-white">{project.status}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-slate-600 dark:text-slate-400">Tasks: <span className="font-medium text-slate-900 dark:text-white">{project.tasks.length}</span></span>
                </div>
                {unassignedTasks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      {unassignedTasks.length} unassigned
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {project.manager && (
                <Link
                  href={`/projects/${params.id}/edit`}
                  className="px-4 py-2 bg-slate-600 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                >
                  Edit Project
                </Link>
              )}
              {project.manager && unassignedTasks.length > 0 && (
                <button
                  onClick={generateRecommendations}
                  disabled={generatingRecs}
                  className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50 transition-colors"
                >
                  {generatingRecs ? "Generating..." : "Generate Recommendations"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tasks Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Tasks ({project.tasks.length})
          </h2>
          <div className="space-y-4">
            {project.tasks.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                <p className="text-slate-500 dark:text-slate-400">No tasks yet</p>
              </div>
            ) : (
              project.tasks.map((task: any) => {
                const taskRecs = recommendations?.find(
                  (r: any) => r.taskId === task.id
                )

                return (
                  <div key={task.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                        >
                          {task.title}
                        </Link>
                        <p className="text-slate-700 dark:text-slate-300 mt-1 text-sm">{task.description}</p>
                      </div>
                      <TaskStatusBadge status={task.status} />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                        {task.assignee ? (
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <Link
                              href={`/users/${task.assignee.id}`}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            >
                              {task.assignee.name}
                            </Link>
                          </div>
                        ) : (
                          <span className="text-orange-600 dark:text-orange-400 font-medium">Unassigned</span>
                        )}
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{task.estimatedEffortHours}h</span>
                      </div>
                    </div>
                      {task.assignee && (
                        <button
                          onClick={() => unassignTask(task.id)}
                          className="px-3 py-1 text-xs bg-slate-600 dark:bg-slate-700 text-white rounded hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                        >
                          Unassign
                        </button>
                      )}
                    </div>

                    {!task.assigneeUserId && taskRecs && taskRecs.recommendations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                          Recommendations:
                        </h4>
                        <div className="space-y-2">
                          {taskRecs.recommendations
                            .sort((a: any, b: any) => {
                              const scoreA = typeof a.score === 'object' ? a.score.totalScore : 0
                              const scoreB = typeof b.score === 'object' ? b.score.totalScore : 0
                              return scoreB - scoreA
                            })
                            .slice(0, 3)
                            .map((rec: any, index: number) => {
                              const scorePercent = typeof rec.score === 'object' ? Math.round(rec.score.totalScore * 100) : 0
                              const scoreData = typeof rec.score === 'object' ? rec.score : {}
                              const matchingSkills = scoreData.skillsMatched || []
                              const missingSkills = scoreData.skillsMissing || []
                              
                              return (
                            <div
                              key={rec.id}
                              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-lg"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      {rec.recommendedAssigneeType === "AI" ? (
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                          AI Automation
                                        </p>
                                      ) : (
                                        <Link
                                          href={`/users/${rec.recommendedAssigneeUserId}`}
                                          className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                        >
                                          {rec.employeeName || "Employee"}
                                        </Link>
                                      )}
                                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                        {scorePercent}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => applyRecommendation(rec.id)}
                                  className="ml-3 px-3 py-1 text-sm bg-indigo-600 dark:bg-indigo-500 text-white rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                                >
                                  Apply
                                </button>
                              </div>

                              <div className="ml-9 space-y-2">
                                {matchingSkills.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                      ✓ Matching Skills:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {matchingSkills.map((skill: string, i: number) => (
                                        <span
                                          key={i}
                                          className="px-2 py-0.5 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {missingSkills.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                      ⚠ Missing Skills:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {missingSkills.map((skill: string, i: number) => (
                                        <span
                                          key={i}
                                          className="px-2 py-0.5 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {scoreData.seniorityScore !== undefined && (
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                      Seniority Match:
                                    </p>
                                    <span className="text-xs text-slate-600 dark:text-slate-400">
                                      {Math.round(scoreData.seniorityScore * 100)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )})}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Project Channel Card */}
        {project.channels && project.channels[0] && project.channels[0].messages.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Project Channel</h2>
            <div className="space-y-3 mb-4">
              {project.channels[0].messages.map((msg: any) => (
                <div key={msg.id} className="border-l-4 border-indigo-500 dark:border-indigo-400 bg-slate-50 dark:bg-slate-900/50 pl-4 py-2 rounded">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {msg.sender.name}
                  </div>
                  <div className="text-slate-700 dark:text-slate-300">{msg.body}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(msg.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
