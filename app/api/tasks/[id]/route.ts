import { NextResponse } from "next/server"
import { requireRole, assertTaskAccess, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole, TaskStatus, AssigneeType } from "@prisma/client"
import { logActivity } from "@/lib/activity"
import { createNotification } from "@/lib/notifications"
import { z } from "zod"

const UpdateTaskSchema = z.object({
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "BLOCKED", "NEEDS_REVIEW", "DONE"]).optional(),
  assigneeType: z.enum(["EMPLOYEE", "AI"]).nullable().optional(),
  assigneeUserId: z.string().nullable().optional(),
  reviewerManagerId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.number().min(0).max(2).optional(),
  dueDate: z.string().optional(),
  estimatedEffortHours: z.number().min(0.5).max(8).optional(),
  skills: z.array(z.string()).optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
})

async function handleGET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])
  await assertTaskAccess(user.id, user.role, params.id)

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      project: {
        include: {
          manager: { select: { id: true, name: true, email: true } },
        },
      },
      assignee: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true, email: true } },
      taskThread: {
        include: {
          messages: {
            include: {
              sender: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  })

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  return NextResponse.json({ task })
}

async function handlePATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])
  await assertTaskAccess(user.id, user.role, params.id)

  const body = await req.json()
  const validated = UpdateTaskSchema.parse(body)

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: { project: true },
  })

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }

  // Employees can only update status and comments
  if (user.role === UserRole.EMPLOYEE) {
    if (task.assigneeUserId !== user.id) {
      return NextResponse.json({ error: "Can only update your own tasks" }, { status: 403 })
    }
    // Only allow status updates for employees
    const allowedUpdates: any = {}
    if (validated.status) allowedUpdates.status = validated.status
    
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: allowedUpdates,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    })

    if (validated.status && validated.status !== task.status) {
      await logActivity({
        actorId: user.id,
        entityType: "task",
        entityId: params.id,
        action: "status_changed",
        payload: { 
          from: task.status, 
          to: validated.status,
          projectId: task.projectId,
        },
      })

      // Notify manager and reviewer
      if (task.reviewerManagerId) {
        await createNotification({
          userId: task.reviewerManagerId,
          type: "status_change",
          payload: {
            taskId: params.id,
            taskTitle: task.title,
            status: validated.status,
            changedBy: user.name,
          },
        })
      }
    }

    return NextResponse.json({ task: updatedTask })
  }

  // Managers and Executives can update anything
  const updateData: any = {}
  if (validated.status) updateData.status = validated.status as TaskStatus
  if (validated.assigneeType) updateData.assigneeType = validated.assigneeType as AssigneeType
  if (validated.assigneeUserId !== undefined) updateData.assigneeUserId = validated.assigneeUserId
  if (validated.reviewerManagerId !== undefined) updateData.reviewerManagerId = validated.reviewerManagerId
  if (validated.title) updateData.title = validated.title
  if (validated.description) updateData.description = validated.description
  if (validated.priority !== undefined) updateData.priority = validated.priority
  if (validated.dueDate !== undefined) updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null
  if (validated.estimatedEffortHours !== undefined) updateData.estimatedEffortHours = validated.estimatedEffortHours
  if (validated.skills !== undefined) updateData.skills = validated.skills
  if (validated.acceptanceCriteria !== undefined) updateData.acceptanceCriteria = validated.acceptanceCriteria

  const updatedTask = await prisma.task.update({
    where: { id: params.id },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      reviewer: { select: { id: true, name: true, email: true } },
    },
  })

  // Log assignment changes
  if (validated.assigneeUserId !== undefined && validated.assigneeUserId !== task.assigneeUserId) {
    if (validated.assigneeUserId === null) {
      // Unassignment
      await logActivity({
        actorId: user.id,
        entityType: "task",
        entityId: params.id,
        action: "unassigned",
        payload: {
          previousAssigneeUserId: task.assigneeUserId,
          taskTitle: task.title,
          projectId: task.projectId,
        },
      })
    } else {
      // Assignment
      await logActivity({
        actorId: user.id,
        entityType: "task",
        entityId: params.id,
        action: "assigned",
        payload: {
          assigneeUserId: validated.assigneeUserId,
          taskTitle: task.title,
          projectId: task.projectId,
        },
      })

      // Notify assignee
      await createNotification({
        userId: validated.assigneeUserId,
        type: "assignment",
        payload: {
          taskId: params.id,
          taskTitle: task.title,
          projectId: task.projectId,
          assignedBy: user.name,
        },
      })
    }
  }

  // Log status changes
  if (validated.status && validated.status !== task.status) {
    await logActivity({
      actorId: user.id,
      entityType: "task",
      entityId: params.id,
      action: "status_changed",
      payload: {
        from: task.status,
        to: validated.status,
        projectId: task.projectId,
      },
    })
  }

  return NextResponse.json({ task: updatedTask })
}

export const GET = withErrorHandling(handleGET)
export const PATCH = withErrorHandling(handlePATCH)
