import { NextResponse } from "next/server"
import { requireRole, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { z } from "zod"

const CreateGroupChatSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  memberIds: z.array(z.string()).min(1),
})

async function handleGET(req: Request) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])

  // Get all group chats where the user is a member
  const groupChats = await prisma.groupChat.findMany({
    where: {
      members: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: {
          sender: { select: { id: true, name: true } },
        },
      },
      _count: {
        select: { members: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  // Transform to match expected format
  const transformed = groupChats.map((gc) => ({
    id: gc.id,
    name: gc.name,
    description: gc.description,
    memberCount: gc._count.members,
    members: gc.members,
    lastMessage: gc.messages[0]
      ? {
          body: gc.messages[0].body,
          createdAt: gc.messages[0].createdAt.toISOString(),
          sender: gc.messages[0].sender,
        }
      : null,
  }))

  return NextResponse.json(transformed)
}

async function handlePOST(req: Request) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])

  const body = await req.json()
  const validated = CreateGroupChatSchema.parse(body)

  // Create group chat
  const groupChat = await prisma.groupChat.create({
    data: {
      name: validated.name,
      description: validated.description,
      createdById: user.id,
      members: {
        create: [
          { userId: user.id }, // Creator is automatically a member
          ...validated.memberIds
            .filter((id) => id !== user.id) // Don't duplicate creator
            .map((userId) => ({ userId })),
        ],
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      },
    },
  })

  return NextResponse.json({ groupChat }, { status: 201 })
}

export const GET = withErrorHandling(handleGET)
export const POST = withErrorHandling(handlePOST)
