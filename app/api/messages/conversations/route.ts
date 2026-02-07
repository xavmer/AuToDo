import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

// GET /api/messages/conversations - Get list of users with messages and unread counts
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get all users except current user
  const users = await prisma.user.findMany({
    where: {
      id: { not: session.user.id },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
    },
    orderBy: [
      { role: "asc" },
      { name: "asc" },
    ],
  })

  // Get unread message counts for each user
  const unreadCounts = await prisma.directMessage.groupBy({
    by: ["senderId"],
    where: {
      receiverId: session.user.id,
      read: false,
    },
    _count: {
      id: true,
    },
  })

  const unreadMap = Object.fromEntries(
    unreadCounts.map((item) => [item.senderId, item._count.id])
  )

  // Get last message with each user
  const conversations = await Promise.all(
    users.map(async (user) => {
      const lastMessage = await prisma.directMessage.findFirst({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: user.id },
            { senderId: user.id, receiverId: session.user.id },
          ],
        },
        orderBy: { createdAt: "desc" },
      })

      return {
        ...user,
        unreadCount: unreadMap[user.id] || 0,
        lastMessage: lastMessage
          ? {
              body: lastMessage.body,
              createdAt: lastMessage.createdAt,
              isSentByMe: lastMessage.senderId === session.user.id,
            }
          : null,
      }
    })
  )

  // Sort by: unread first, then by last message time, then by name
  conversations.sort((a, b) => {
    if (a.unreadCount !== b.unreadCount) {
      return b.unreadCount - a.unreadCount
    }
    if (a.lastMessage && b.lastMessage) {
      return (
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
      )
    }
    if (a.lastMessage) return -1
    if (b.lastMessage) return 1
    return a.name.localeCompare(b.name)
  })

  return NextResponse.json(conversations)
}
