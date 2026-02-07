import { NextResponse } from "next/server"
import { requireRole, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { z } from "zod"

const SendMessageSchema = z.object({
  body: z.string().min(1),
})

async function handleGET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])

  // Verify user is a member of this group chat
  const membership = await prisma.groupChatMember.findFirst({
    where: {
      groupChatId: params.id,
      userId: user.id,
    },
  })

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this group chat" }, { status: 403 })
  }

  const messages = await prisma.groupChatMessage.findMany({
    where: { groupChatId: params.id },
    include: {
      sender: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  // Transform to match expected format
  const transformed = messages.map((msg) => ({
    id: msg.id,
    body: msg.body,
    senderId: msg.senderId,
    groupChatId: msg.groupChatId,
    createdAt: msg.createdAt.toISOString(),
    sender: msg.sender,
  }))

  return NextResponse.json(transformed)
}

async function handlePOST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])

  // Verify user is a member of this group chat
  const membership = await prisma.groupChatMember.findFirst({
    where: {
      groupChatId: params.id,
      userId: user.id,
    },
  })

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this group chat" }, { status: 403 })
  }

  const body = await req.json()
  const validated = SendMessageSchema.parse(body)

  const message = await prisma.groupChatMessage.create({
    data: {
      groupChatId: params.id,
      senderId: user.id,
      body: validated.body,
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  })

  // Update group chat's updatedAt
  await prisma.groupChat.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json({ message }, { status: 201 })
}

export const GET = withErrorHandling(handleGET)
export const POST = withErrorHandling(handlePOST)
