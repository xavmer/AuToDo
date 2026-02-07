"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { KanbanBoard } from "@/components/KanbanBoard"
import { LoadingSpinner } from "@/components/LoadingSpinner"

export default function EmployeeTasksPage() {
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      loadTasks()
    }
  }, [session?.user?.id])

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks/my')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      }
    } catch (err) {
      console.error("Failed to load tasks:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!session?.user) return <LoadingSpinner />
  if (loading) return <LoadingSpinner />

  // Transform tasks to match KanbanBoard expected format
  const transformedTasks = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    estimatedEffortHours: task.estimatedEffortHours,
    skills: task.skills || [],
    project: task.project,
  }))

  return <KanbanBoard initialTasks={transformedTasks} userName={session.user.name || "User"} onRefresh={loadTasks} />
}
