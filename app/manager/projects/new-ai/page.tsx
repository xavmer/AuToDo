"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function NewAIProjectPageManager() {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate plan")
      }

      const data = await response.json()
      
      sessionStorage.setItem("aiPlan", JSON.stringify(data.plan))
      sessionStorage.setItem("aiPrompt", prompt)
      router.push("/manager/projects/new-ai/preview")
    } catch (err) {
      setError("Failed to generate project plan. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-900">
      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              AI Project Generator
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Describe your project and let AI create a detailed task breakdown
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <label
                htmlFor="prompt"
                className="block text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wide"
              >
                Project Description
              </label>
              <div className="relative">
                <textarea
                  id="prompt"
                  rows={12}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Example: Build a customer feedback dashboard with real-time sentiment analysis, filtering by product category, and export capabilities..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                  minLength={10}
                  disabled={loading}
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                  {prompt.length} characters
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading || prompt.length < 10}
                className="relative px-8 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden group"
              >
                {loading ? (
                  <>
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating with AI...
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 opacity-50 blur animate-pulse" />
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Generate Plan
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Side Panel */}
      <div className="w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-6 overflow-auto">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              How It Works
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Describe Your Project</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Provide a detailed description of what you want to build
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">AI Generates Tasks</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Our AI breaks down your project into manageable tasks
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Review & Approve</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Review the generated plan and make any adjustments
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Tips for Best Results
            </h3>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Be specific about features and requirements</span>
              </li>
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Mention any technical constraints or preferences</span>
              </li>
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Include success criteria and goals</span>
              </li>
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Mention timeline or urgency if relevant</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">Powered by AI</p>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                  Using advanced language models to create optimal task breakdowns
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
