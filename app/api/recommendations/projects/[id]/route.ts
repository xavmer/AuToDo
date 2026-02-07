import { NextResponse } from "next/server"
import { requireRole, assertProjectAccess, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { recommendForProject, saveRecommendations } from "@/lib/scoring/recommend"

async function handlePOST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER])
  await assertProjectAccess(user.id, user.role, params.id, user.teamId)

  // Generate and save recommendations
  await saveRecommendations(params.id, user.id)

  // Get the saved recommendations from the database (with IDs)
  const recommendations = await prisma.taskRecommendation.findMany({
    where: {
      task: {
        projectId: params.id,
      },
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          assigneeUserId: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Group by task
  const grouped = recommendations.reduce((acc, rec) => {
    if (!acc[rec.taskId]) {
      acc[rec.taskId] = {
        taskId: rec.taskId,
        taskTitle: rec.task.title,
        recommendations: [],
      }
    }
    acc[rec.taskId].recommendations.push({
      id: rec.id,
      recommendedAssigneeType: rec.recommendedAssigneeType,
      recommendedAssigneeUserId: rec.recommendedAssigneeUserId,
      rationale: rec.rationale,
      score: rec.score,
      employeeName: rec.assignee?.name,
    })
    return acc
  }, {} as Record<string, any>)

  return NextResponse.json({ recommendations: Object.values(grouped) })
}

async function handleGET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER])
  await assertProjectAccess(user.id, user.role, params.id, user.teamId)

  // Get existing recommendations
  const recommendations = await prisma.taskRecommendation.findMany({
    where: {
      task: {
        projectId: params.id,
      },
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          assigneeUserId: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Group by task
  const grouped = recommendations.reduce((acc, rec) => {
    if (!acc[rec.taskId]) {
      acc[rec.taskId] = {
        taskId: rec.taskId,
        taskTitle: rec.task.title,
        recommendations: [],
      }
    }
    acc[rec.taskId].recommendations.push({
      id: rec.id,
      recommendedAssigneeType: rec.recommendedAssigneeType,
      recommendedAssigneeUserId: rec.recommendedAssigneeUserId,
      rationale: rec.rationale,
      score: rec.score,
      employeeName: rec.assignee?.name,
    })
    return acc
  }, {} as Record<string, any>)

  return NextResponse.json({
    recommendations: Object.values(grouped),
  })
}

export const POST = withErrorHandling(handlePOST)
export const GET = withErrorHandling(handleGET)
