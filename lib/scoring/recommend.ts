import { prisma } from "@/lib/db"
import { AssigneeType, Seniority } from "@prisma/client"

interface EmployeeWithProfile {
  id: string
  name: string
  email: string
  employeeProfile: {
    skills: any
    weaknesses: any
    capacityHoursPerWeek: number
    seniority: Seniority
    preferences: any
  } | null
}

interface Task {
  id: string
  title: string
  skills: any
  estimatedEffortHours: number
  suggestedAssigneeType?: AssigneeType | null
}

interface ScoreBreakdown {
  skillOverlapScore: number
  capacityScore: number
  seniorityScore: number
  totalScore: number
  skillsMatched: string[]
  skillsMissing: string[]
  availableCapacity: number
}

interface Recommendation {
  taskId: string
  recommendedAssigneeType: AssigneeType
  recommendedAssigneeUserId: string | null
  employeeName?: string
  score: ScoreBreakdown
  rationale: string
  rank: number
}

interface RecommendationResult {
  taskId: string
  taskTitle: string
  recommendations: Recommendation[]
}

// Weights for scoring (can be tuned)
const WEIGHTS = {
  skillOverlap: 0.5,
  capacity: 0.3,
  seniority: 0.2,
}

// Minimum score threshold to recommend a person
const MIN_RECOMMENDATION_SCORE = 0.3

/**
 * Calculate skill overlap score
 */
function calculateSkillOverlap(
  taskSkills: string[],
  employeeSkills: string[]
): { score: number; matched: string[]; missing: string[] } {
  if (taskSkills.length === 0) {
    return { score: 1, matched: [], missing: [] }
  }

  const taskSkillsLower = taskSkills.map((s) => s.toLowerCase())
  const employeeSkillsLower = employeeSkills.map((s) => s.toLowerCase())

  const matchedLower = taskSkillsLower.filter((s) => employeeSkillsLower.includes(s))
  const missingLower = taskSkillsLower.filter((s) => !employeeSkillsLower.includes(s))

  const score = matchedLower.length / taskSkills.length

  // Map back to original case
  const matched = taskSkills.filter((s) => matchedLower.includes(s.toLowerCase()))
  const missing = taskSkills.filter((s) => missingLower.includes(s.toLowerCase()))

  return {
    score,
    matched,
    missing,
  }
}

/**
 * Calculate capacity score
 * Returns a score based on available capacity
 */
function calculateCapacityScore(
  employeeCapacity: number,
  currentlyAssignedHours: number,
  taskEffortHours: number
): { score: number; availableCapacity: number } {
  const availableCapacity = employeeCapacity - currentlyAssignedHours

  if (availableCapacity <= 0) {
    return { score: 0, availableCapacity: 0 }
  }

  if (availableCapacity < taskEffortHours) {
    // Partial capacity available
    return {
      score: availableCapacity / taskEffortHours,
      availableCapacity,
    }
  }

  // Full capacity available, score based on how much extra capacity they have
  const utilizationRatio = currentlyAssignedHours / employeeCapacity
  const score = 1 - utilizationRatio * 0.5 // Prefer less utilized employees slightly

  return { score: Math.min(score, 1), availableCapacity }
}

/**
 * Calculate seniority match score
 * Simple heuristic: estimate task complexity from effort hours and required skills
 */
function calculateSeniorityScore(
  taskEffortHours: number,
  taskSkillsCount: number,
  employeeSeniority: Seniority
): number {
  // Estimate complexity
  let requiredSeniority: Seniority

  if (taskEffortHours >= 6 && taskSkillsCount >= 3) {
    requiredSeniority = Seniority.SENIOR
  } else if (taskEffortHours >= 4 || taskSkillsCount >= 2) {
    requiredSeniority = Seniority.MID
  } else {
    requiredSeniority = Seniority.JUNIOR
  }

  // Perfect match
  if (requiredSeniority === employeeSeniority) {
    return 1
  }

  // Over-qualified (slight penalty)
  const seniorityOrder = [Seniority.JUNIOR, Seniority.MID, Seniority.SENIOR]
  const requiredIndex = seniorityOrder.indexOf(requiredSeniority)
  const employeeIndex = seniorityOrder.indexOf(employeeSeniority)

  if (employeeIndex > requiredIndex) {
    return 0.8 // Over-qualified
  } else {
    return 0.5 // Under-qualified
  }
}

/**
 * Score a single employee for a single task
 */
async function scoreEmployeeForTask(
  employee: EmployeeWithProfile,
  task: Task,
  currentlyAssignedHours: number
): Promise<ScoreBreakdown> {
  if (!employee.employeeProfile) {
    return {
      skillOverlapScore: 0,
      capacityScore: 0,
      seniorityScore: 0,
      totalScore: 0,
      skillsMatched: [],
      skillsMissing: [],
      availableCapacity: 0,
    }
  }

  const taskSkills = Array.isArray(task.skills) ? task.skills : []
  const employeeSkills = Array.isArray(employee.employeeProfile.skills)
    ? employee.employeeProfile.skills
    : []

  const skillOverlap = calculateSkillOverlap(taskSkills, employeeSkills)
  const capacity = calculateCapacityScore(
    employee.employeeProfile.capacityHoursPerWeek,
    currentlyAssignedHours,
    task.estimatedEffortHours
  )
  const seniorityScore = calculateSeniorityScore(
    task.estimatedEffortHours,
    taskSkills.length,
    employee.employeeProfile.seniority
  )

  const totalScore =
    skillOverlap.score * WEIGHTS.skillOverlap +
    capacity.score * WEIGHTS.capacity +
    seniorityScore * WEIGHTS.seniority

  return {
    skillOverlapScore: skillOverlap.score,
    capacityScore: capacity.score,
    seniorityScore,
    totalScore,
    skillsMatched: skillOverlap.matched,
    skillsMissing: skillOverlap.missing,
    availableCapacity: capacity.availableCapacity,
  }
}

/**
 * Generate rationale text for a recommendation
 */
function generateRationale(
  employeeName: string,
  score: ScoreBreakdown,
  rank: number
): string {
  const parts = []

  parts.push(`Rank #${rank} candidate: ${employeeName}`)
  parts.push(`Overall score: ${(score.totalScore * 100).toFixed(1)}%`)

  if (score.skillsMatched.length > 0) {
    parts.push(`Matching skills: ${score.skillsMatched.join(", ")}`)
  }

  if (score.skillsMissing.length > 0) {
    parts.push(`Missing skills: ${score.skillsMissing.join(", ")}`)
  }

  parts.push(
    `Available capacity: ${score.availableCapacity.toFixed(1)} hours/week`
  )
  parts.push(
    `Seniority match: ${(score.seniorityScore * 100).toFixed(0)}%`
  )

  return parts.join(". ") + "."
}

/**
 * Calculate currently assigned hours for employees
 */
async function getCurrentlyAssignedHours(
  employeeIds: string[]
): Promise<Map<string, number>> {
  const assignments = await prisma.task.groupBy({
    by: ["assigneeUserId"],
    where: {
      assigneeUserId: { in: employeeIds },
      status: { in: ["NOT_STARTED", "IN_PROGRESS", "BLOCKED"] },
    },
    _sum: {
      estimatedEffortHours: true,
    },
  })

  const hoursMap = new Map<string, number>()
  for (const assignment of assignments) {
    if (assignment.assigneeUserId) {
      hoursMap.set(
        assignment.assigneeUserId,
        assignment._sum.estimatedEffortHours || 0
      )
    }
  }

  return hoursMap
}

/**
 * Recommend assignments for a single task
 */
export async function recommendForTask(
  task: Task,
  teamId: string
): Promise<RecommendationResult> {
  // Get all employees in the team with profiles
  const employees = await prisma.user.findMany({
    where: {
      teamId,
      role: "EMPLOYEE",
      employeeProfile: { isNot: null },
    },
    include: {
      employeeProfile: true,
    },
  })

  if (employees.length === 0) {
    // No employees, recommend AI
    return {
      taskId: task.id,
      taskTitle: task.title,
      recommendations: [
        {
          taskId: task.id,
          recommendedAssigneeType: AssigneeType.AI,
          recommendedAssigneeUserId: null,
          score: {
            skillOverlapScore: 0,
            capacityScore: 0,
            seniorityScore: 0,
            totalScore: 0,
            skillsMatched: [],
            skillsMissing: [],
            availableCapacity: 0,
          },
          rationale: "No employees available in team. Recommend AI automation.",
          rank: 1,
        },
      ],
    }
  }

  // Get current workload
  const workloadMap = await getCurrentlyAssignedHours(employees.map((e) => e.id))

  // Score each employee
  const scoredEmployees = await Promise.all(
    employees.map(async (employee) => {
      const currentLoad = workloadMap.get(employee.id) || 0
      const score = await scoreEmployeeForTask(employee, task, currentLoad)
      return {
        employee,
        score,
      }
    })
  )

  // Sort by score descending
  scoredEmployees.sort((a, b) => b.score.totalScore - a.score.totalScore)

  // Take top 3
  const topEmployees = scoredEmployees.slice(0, 3)

  // Check if we should recommend AI instead
  const bestScore = topEmployees[0]?.score.totalScore || 0
  const shouldRecommendAI =
    task.suggestedAssigneeType === AssigneeType.AI ||
    bestScore < MIN_RECOMMENDATION_SCORE

  const recommendations: Recommendation[] = []

  if (shouldRecommendAI) {
    recommendations.push({
      taskId: task.id,
      recommendedAssigneeType: AssigneeType.AI,
      recommendedAssigneeUserId: null,
      score: {
        skillOverlapScore: 0,
        capacityScore: 0,
        seniorityScore: 0,
        totalScore: 0,
        skillsMatched: [],
        skillsMissing: [],
        availableCapacity: 0,
      },
      rationale:
        task.suggestedAssigneeType === AssigneeType.AI
          ? "Task is suitable for AI automation based on initial analysis."
          : `Best employee match score (${(bestScore * 100).toFixed(1)}%) is below threshold. Recommend AI automation.`,
      rank: 1,
    })
  }

  // Add employee recommendations
  topEmployees.forEach((item, index) => {
    recommendations.push({
      taskId: task.id,
      recommendedAssigneeType: AssigneeType.EMPLOYEE,
      recommendedAssigneeUserId: item.employee.id,
      employeeName: item.employee.name,
      score: item.score,
      rationale: generateRationale(item.employee.name, item.score, index + 1),
      rank: shouldRecommendAI ? index + 2 : index + 1,
    })
  })

  return {
    taskId: task.id,
    taskTitle: task.title,
    recommendations,
  }
}

/**
 * Recommend assignments for all tasks in a project
 */
export async function recommendForProject(
  projectId: string
): Promise<RecommendationResult[]> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      manager: true,
      tasks: {
        where: {
          assigneeUserId: null, // Only recommend for unassigned tasks
        },
      },
    },
  })

  if (!project) {
    throw new Error("Project not found")
  }

  if (!project.manager.teamId) {
    throw new Error("Project manager has no team")
  }

  const results = await Promise.all(
    project.tasks.map((task) => recommendForTask(task, project.manager.teamId!))
  )

  return results
}

/**
 * Save recommendations to the database
 */
export async function saveRecommendations(
  projectId: string,
  actorId: string
): Promise<void> {
  const results = await recommendForProject(projectId)

  for (const result of results) {
    for (const rec of result.recommendations) {
      await prisma.taskRecommendation.create({
        data: {
          taskId: rec.taskId,
          recommendedAssigneeType: rec.recommendedAssigneeType,
          recommendedAssigneeUserId: rec.recommendedAssigneeUserId,
          score: rec.score,
          rationale: rec.rationale,
        },
      })
    }
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      actorId,
      entityType: "project",
      entityId: projectId,
      action: "generated_recommendations",
      payload: {
        taskCount: results.length,
        totalRecommendations: results.reduce(
          (sum, r) => sum + r.recommendations.length,
          0
        ),
      },
    },
  })
}
