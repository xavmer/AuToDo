import { NextResponse } from "next/server"
import { requireRole, assertProjectAccess, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole, ProjectStatus, AssigneeType, TaskStatus } from "@prisma/client"
import { logActivity } from "@/lib/activity"
import { z } from "zod"

const TaskInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  acceptanceCriteria: z.array(z.string()),
  skills: z.array(z.string()),
  estimatedEffortHours: z.number().max(8),
  dependencies: z.array(z.string()).default([]),
  priority: z.number().min(0).max(2).default(0),
  suggestedAssigneeType: z.enum(["employee", "ai"]).optional(),
  suggestedReviewerRole: z.string().optional(),
})

const ApprovePlanSchema = z.object({
  projectTitle: z.string().min(1),
  overview: z.string(),
  managerId: z.string(),
  tasks: z.array(TaskInputSchema),
  originalPrompt: z.string().optional(),
  originalPlan: z.any().optional(), // Store original AI plan for traceability
})

async function handlePOST(req: Request) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER])

  const body = await req.json()
  const validated = ApprovePlanSchema.parse(body)

  // Create project
  const project = await prisma.project.create({
    data: {
      title: validated.projectTitle,
      description: validated.overview,
      prompt: validated.originalPrompt,
      createdById: user.id,
      managerId: validated.managerId,
      status: ProjectStatus.ACTIVE,
    },
  })

  // Create default channel
  const channel = await prisma.channel.create({
    data: {
      projectId: project.id,
      name: "general",
    },
  })

  // Create tasks
  const taskMap = new Map<string, string>() // title -> id mapping

  for (const taskInput of validated.tasks) {
    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        title: taskInput.title,
        description: taskInput.description,
        estimatedEffortHours: taskInput.estimatedEffortHours,
        skills: taskInput.skills,
        acceptanceCriteria: taskInput.acceptanceCriteria,
        dependencies: taskInput.dependencies,
        priority: taskInput.priority,
        suggestedAssigneeType: taskInput.suggestedAssigneeType 
          ? (taskInput.suggestedAssigneeType.toUpperCase() as AssigneeType)
          : undefined,
        suggestedReviewerRole: taskInput.suggestedReviewerRole,
        status: TaskStatus.NOT_STARTED,
      },
    })

    taskMap.set(taskInput.title, task.id)

    // Create task thread
    await prisma.taskThread.create({
      data: {
        taskId: task.id,
        channelId: channel.id,
      },
    })
  }

  // Log activity with original plan
  await logActivity({
    actorId: user.id,
    entityType: "project",
    entityId: project.id,
    action: "created_from_ai_plan",
    payload: {
      originalPrompt: validated.originalPrompt,
      originalPlan: validated.originalPlan,
      taskCount: validated.tasks.length,
    },
  })

  const createdProject = await prisma.project.findUnique({
    where: { id: project.id },
    include: {
      tasks: true,
      channels: true,
      manager: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  return NextResponse.json({ project: createdProject }, { status: 201 })
}

export const POST = withErrorHandling(handlePOST)
