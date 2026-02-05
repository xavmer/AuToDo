import { NextResponse } from "next/server"
import { requireRole, assertProjectAccess, withErrorHandling, ForbiddenError } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { logActivity } from "@/lib/activity"
import { createNotifications, parseMentions } from "@/lib/notifications"
import { z } from "zod"

const CreateMessageSchema = z.object({
  body: z.string().min(1),
})

async function handleGET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])
  await assertProjectAccess(user.id, user.role, params.id, user.teamId)

  const channel = await prisma.channel.findFirst({
    where: { projectId: params.id },
    include: {
      messages: {
        include: {
          sender: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 })
  }

  return NextResponse.json({ messages: channel.messages })
}

async function handlePOST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])
  await assertProjectAccess(user.id, user.role, params.id, user.teamId)

  // Employees can only read, not post to project channels (they can post in task threads)
  if (user.role === UserRole.EMPLOYEE) {
    throw new ForbiddenError("Employees cannot post to project channels")
  }

  const body = await req.json()
  const validated = CreateMessageSchema.parse(body)

  const channel = await prisma.channel.findFirst({
    where: { projectId: params.id },
  })

  if (!channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 })
  }

  const message = await prisma.message.create({
    data: {
      channelId: channel.id,
      senderId: user.id,
      body: validated.body,
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
    },
  })

  // Parse mentions and create notifications
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      tasks: {
        include: {
          assignee: { select: { id: true, name: true } },
        },
      },
      manager: { select: { id: true, name: true } },
    },
  })

  if (project) {
    const allUsers = [
      project.manager,
      ...project.tasks.map((t) => t.assignee).filter(Boolean),
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
              projectId: params.id,
              senderId: user.id,
              senderName: user.name,
              body: validated.body,
            },
          }))
      )
    }
  }

  await logActivity({
    actorId: user.id,
    entityType: "message",
    entityId: message.id,
    action: "posted",
    payload: { channelId: channel.id, projectId: params.id },
  })

  return NextResponse.json({ message }, { status: 201 })
}

export const GET = withErrorHandling(handleGET)
export const POST = withErrorHandling(handlePOST)
