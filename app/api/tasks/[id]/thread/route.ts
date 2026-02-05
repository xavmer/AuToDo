import { NextResponse } from "next/server"
import { requireRole, assertTaskAccess, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { logActivity } from "@/lib/activity"
import { createNotifications, parseMentions } from "@/lib/notifications"
import { z } from "zod"

const CreateThreadMessageSchema = z.object({
  body: z.string().min(1),
})

async function handleGET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])
  await assertTaskAccess(user.id, user.role, params.id)

  const taskThread = await prisma.taskThread.findUnique({
    where: { taskId: params.id },
    include: {
      messages: {
        include: {
          sender: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!taskThread) {
    return NextResponse.json({ error: "Task thread not found" }, { status: 404 })
  }

  return NextResponse.json({ messages: taskThread.messages })
}

async function handlePOST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])
  await assertTaskAccess(user.id, user.role, params.id)

  const body = await req.json()
  const validated = CreateThreadMessageSchema.parse(body)

  const taskThread = await prisma.taskThread.findUnique({
    where: { taskId: params.id },
    include: {
      task: {
        include: {
          assignee: { select: { id: true, name: true } },
          reviewer: { select: { id: true, name: true } },
          project: {
            include: {
              manager: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  })

  if (!taskThread) {
    return NextResponse.json({ error: "Task thread not found" }, { status: 404 })
  }

  const message = await prisma.threadMessage.create({
    data: {
      threadId: taskThread.id,
      senderId: user.id,
      body: validated.body,
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
    },
  })

  // Parse mentions and create notifications
  const allUsers = [
    taskThread.task.assignee,
    taskThread.task.reviewer,
    taskThread.task.project.manager,
  ].filter((u): u is { id: string; name: string } => u !== null)

  const mentionedUserIds = parseMentions(validated.body, allUsers)

  if (mentionedUserIds.length > 0) {
    await createNotifications(
      mentionedUserIds
        .filter((id) => id !== user.id)
        .map((userId) => ({
          userId,
          type: "mention" as const,
          payload: {
            messageId: message.id,
            taskId: params.id,
            taskTitle: taskThread.task.title,
            senderId: user.id,
            senderName: user.name,
            body: validated.body,
          },
        }))
    )
  }

  await logActivity({
    actorId: user.id,
    entityType: "thread_message",
    entityId: message.id,
    action: "posted",
    payload: { taskId: params.id, threadId: taskThread.id },
  })

  return NextResponse.json({ message }, { status: 201 })
}

export const GET = withErrorHandling(handleGET)
export const POST = withErrorHandling(handlePOST)
