"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import Link from "next/link"
import { TaskStatusBadge } from "@/components/TaskStatusBadge"
import { useSidebar } from "@/components/SidebarLayout"
import { MessageSquare, Edit2, Save, X, Upload } from "lucide-react"

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: session } = useSession()
  const { openMessageWith } = useSidebar()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editedAvatarUrl, setEditedAvatarUrl] = useState("")
  const [editedBio, setEditedBio] = useState("")
  const [saving, setSaving] = useState(false)

  const isOwnProfile = session?.user?.id === params.id

  useEffect(() => {
    loadUser()
  }, [params.id])

  const loadUser = async () => {
    try {
      const response = await fetch(`/api/users/${params.id}`)
      if (!response.ok) throw new Error("Failed to load user")
      const data = await response.json()
      setUser(data.user)
      setEditedAvatarUrl(data.user.avatarUrl || "")
      setEditedBio(data.user.bio || "")
    } catch (err) {
      setError("Failed to load user profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/users/${params.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avatarUrl: editedAvatarUrl || null,
          bio: editedBio || null,
        }),
      })

      if (!response.ok) throw new Error("Failed to update profile")
      
      const data = await response.json()
      setUser({ ...user, avatarUrl: data.user.avatarUrl, bio: data.user.bio })
      setIsEditing(false)
    } catch (err) {
      alert("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditedAvatarUrl(user.avatarUrl || "")
    setEditedBio(user.bio || "")
    setIsEditing(false)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <div className="text-red-600 dark:text-red-400">{error}</div>
  if (!user) return <div className="text-slate-600 dark:text-slate-400">User not found</div>

  const skills = Array.isArray(user.employeeProfile?.skills) ? user.employeeProfile.skills : []
  const weaknesses = Array.isArray(user.employeeProfile?.weaknesses) ? user.employeeProfile.weaknesses : []
  const currentHours = user.assignedTasks?.reduce((sum: number, task: any) => sum + (task.estimatedEffortHours || 0), 0) || 0
  const capacity = user.employeeProfile?.capacityHoursPerWeek || 40

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
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

        {/* Profile Header Card */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex items-start gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {isEditing ? (
                <div className="space-y-2">
                  {editedAvatarUrl ? (
                    <img
                      src={editedAvatarUrl}
                      alt={user.name}
                      className="w-32 h-32 rounded-full object-cover shadow-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={editedAvatarUrl ? 'hidden' : 'w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg'}>
                    {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </div>
                  <input
                    type="text"
                    value={editedAvatarUrl}
                    onChange={(e) => setEditedAvatarUrl(e.target.value)}
                    placeholder="Image URL"
                    className="w-32 px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              ) : user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-32 h-32 rounded-full object-cover shadow-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              {!isEditing && !user.avatarUrl && (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {user.name}
                </h1>
                <div className="flex gap-2">
                  {isOwnProfile && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-md"
                    >
                      <Edit2 size={18} />
                      Edit Profile
                    </button>
                  )}
                  {isEditing && (
                    <>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg transition-colors shadow-md"
                      >
                        <Save size={18} />
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-lg transition-colors shadow-md"
                      >
                        <X size={18} />
                        Cancel
                      </button>
                    </>
                  )}
                  {!isOwnProfile && (
                    <button
                      onClick={() => openMessageWith(user.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-md"
                    >
                      <MessageSquare size={18} />
                      Message
                    </button>
                  )}
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4">{user.email}</p>

              {/* Bio Section */}
              {isEditing ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600 focus:border-transparent"
                  />
                </div>
              ) : user.bio ? (
                <p className="text-slate-700 dark:text-slate-300 mb-4 italic">
                  "{user.bio}"
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3 mb-4">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full text-sm font-medium">
                  {user.role}
                </span>
                {user.employeeProfile?.seniority && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                    {user.employeeProfile.seniority}
                  </span>
                )}
                {user.team && (
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-full text-sm font-medium">
                    {user.team.name}
                  </span>
                )}
              </div>

              {/* Capacity Bar */}
              {user.employeeProfile && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
                    <span>Current Workload</span>
                    <span className="font-medium">
                      {currentHours.toFixed(1)} / {capacity} hours per week
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        currentHours / capacity >= 0.9
                          ? "bg-red-500"
                          : currentHours / capacity >= 0.7
                          ? "bg-orange-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min((currentHours / capacity) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills Card */}
          {skills.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Skills</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-lg text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses Card */}
          {weaknesses.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Areas for Growth</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {weaknesses.map((weakness: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-lg text-sm font-medium"
                  >
                    {weakness}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current Tasks */}
        {user.assignedTasks && user.assignedTasks.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Current Tasks ({user.assignedTasks.length})
            </h2>
            <div className="space-y-3">
              {user.assignedTasks.map((task: any) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="block p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-slate-900 dark:text-white">{task.title}</h3>
                    <TaskStatusBadge status={task.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {task.project.title}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {task.estimatedEffortHours}h
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Managed Projects */}
        {user.managedProjects && user.managedProjects.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Managed Projects ({user.managedProjects.length})
            </h2>
            <div className="space-y-3">
              {user.managedProjects.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-slate-900 dark:text-white">{project.title}</h3>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium">
                      {project.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
