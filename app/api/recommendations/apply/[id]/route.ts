import { NextResponse } from "next/server"
import { requireRole, assertProjectAccess, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole, AssigneeType } from "@prisma/client"
import { logActivity } from "@/lib/activity"
import { createNotification } from "@/lib/notifications"
import { z } from "zod"

async function handlePOST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.MANAGER, UserRole.EXECUTIVE])

  // Get recommendation using the ID from the URL path
  const recommendation = await prisma.taskRecommendation.findUnique({
    where: { id: params.id },
    include: {
      task: {
        include: {
          project: true,
        },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  if (!recommendation) {
    return NextResponse.json(
      { error: "Recommendation not found" },
      { status: 404 }
    )
  }

  // Verify project access
  await assertProjectAccess(
    user.id,
    user.role,
    recommendation.task.projectId,
    user.teamId
  )

  // Apply the recommendation
  const updatedTask = await prisma.task.update({
    where: { id: recommendation.taskId },
    data: {
      assigneeType: recommendation.recommendedAssigneeType,
      assigneeUserId: recommendation.recommendedAssigneeUserId,
      reviewerManagerId: user.id, // Set current user as reviewer
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  // Log activity
  await logActivity({
    actorId: user.id,
    entityType: "task",
    entityId: recommendation.taskId,
    action: "applied_recommendation",
    payload: {
      recommendationId: params.id,
      assigneeType: recommendation.recommendedAssigneeType,
      assigneeUserId: recommendation.recommendedAssigneeUserId,
      rationale: recommendation.rationale,
      score: recommendation.score,
    },
  })

  // Notify assignee if it's an employee
  if (
    recommendation.recommendedAssigneeType === AssigneeType.EMPLOYEE &&
    recommendation.recommendedAssigneeUserId
  ) {
    await createNotification({
      userId: recommendation.recommendedAssigneeUserId,
      type: "assignment",
      payload: {
        taskId: recommendation.taskId,
        taskTitle: recommendation.task.title,
        projectId: recommendation.task.projectId,
        assignedBy: user.name,
        rationale: recommendation.rationale,
      },
    })
  }

  return NextResponse.json({
    task: updatedTask,
    recommendation: recommendation,
  })
}

export const POST = withErrorHandling(handlePOST)
