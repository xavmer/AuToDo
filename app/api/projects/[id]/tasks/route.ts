import { NextResponse } from "next/server"
import { requireRole, assertProjectAccess, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole, AssigneeType, TaskStatus } from "@prisma/client"
import { logActivity } from "@/lib/activity"
import { z } from "zod"

const CreateTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  estimatedEffortHours: z.number().max(80),
  skills: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  dependencies: z.array(z.string()).default([]),
  priority: z.number().min(0).max(2).default(0),
  useAI: z.boolean().default(false),
  suggestedAssigneeType: z.enum(["EMPLOYEE", "AI"]).optional(),
  suggestedReviewerRole: z.string().default("manager"),
  dueDate: z.string().optional(),
})

async function handlePOST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER])
  await assertProjectAccess(user.id, user.role, params.id, user.teamId)

  const body = await req.json()
  const validated = CreateTaskSchema.parse(body)

  const task = await prisma.task.create({
    data: {
      projectId: params.id,
      title: validated.title,
      description: validated.description,
      estimatedEffortHours: validated.estimatedEffortHours,
      skills: validated.skills,
      acceptanceCriteria: validated.acceptanceCriteria,
      dependencies: validated.dependencies,
      priority: validated.priority,
      useAI: validated.useAI,
      suggestedAssigneeType: validated.suggestedAssigneeType as AssigneeType | undefined,
      suggestedReviewerRole: validated.suggestedReviewerRole,
      status: TaskStatus.NOT_STARTED,
      dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
    },
  })

  // Create task thread
  const channel = await prisma.channel.findFirst({
    where: { projectId: params.id },
  })

  if (channel) {
    await prisma.taskThread.create({
      data: {
        taskId: task.id,
        channelId: channel.id,
      },
    })
  }

  await logActivity({
    actorId: user.id,
    entityType: "task",
    entityId: task.id,
    action: "created",
    payload: { title: task.title, projectId: params.id },
  })

  return NextResponse.json({ task }, { status: 201 })
}

export const POST = withErrorHandling(handlePOST)
