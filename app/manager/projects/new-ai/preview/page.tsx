"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface TaskPlan {
  title: string
  description: string
  acceptanceCriteria: string[]
  skills: string[]
  estimatedEffortHours: number
  dependencies: string[]
  suggestedAssigneeType: "employee" | "ai"
  suggestedReviewerRole: string
}

interface ProjectPlan {
  projectTitle: string
  overview: string
  tasks: TaskPlan[]
}

export default function PreviewAIProjectPageManager() {
  const [plan, setPlan] = useState<ProjectPlan | null>(null)
  const [originalPrompt, setOriginalPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    const storedPlan = sessionStorage.getItem("aiPlan")
    const storedPrompt = sessionStorage.getItem("aiPrompt")

    if (!storedPlan) {
      router.push("/manager/projects/new-ai")
      return
    }

    setPlan(JSON.parse(storedPlan))
    setOriginalPrompt(storedPrompt || "")
  }, [router])

  const handleApprove = async () => {
    if (!plan || !session?.user?.id) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/ai/approve-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: plan.projectTitle,
          overview: plan.overview,
          managerId: session.user.id, // Manager assigns to themselves
          tasks: plan.tasks,
          originalPrompt,
          originalPlan: plan,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create project")
      }

      const data = await response.json()
      sessionStorage.removeItem("aiPlan")
      sessionStorage.removeItem("aiPrompt")
      router.push(`/projects/${data.project.id}`)
    } catch (err) {
      setError("Failed to create project. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!plan) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Review AI-Generated Plan
      </h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-2">{plan.projectTitle}</h2>
        <p className="text-gray-700 mb-4">{plan.overview}</p>
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="text-xl font-semibold">Tasks ({plan.tasks.length})</h3>
        {plan.tasks.map((task, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-lg font-semibold text-gray-900">
                {index + 1}. {task.title}
              </h4>
              <span className="text-sm text-gray-500">
                {task.estimatedEffortHours}h
              </span>
            </div>
            <p className="text-gray-700 mb-3">{task.description}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Skills:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {task.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-700">Suggested Assignee:</p>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
                  {task.suggestedAssigneeType}
                </span>
              </div>
            </div>

            {task.acceptanceCriteria.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-gray-700">Acceptance Criteria:</p>
                <ul className="list-disc list-inside mt-1 text-gray-600">
                  {task.acceptanceCriteria.map((criteria, i) => (
                    <li key={i}>{criteria}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          disabled={loading}
        >
          Back
        </button>
        <button
          onClick={handleApprove}
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Approve & Create Project"}
        </button>
      </div>
    </div>
  )
}
