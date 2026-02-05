import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/messages?channelId=xxx - Get messages for a channel
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const channelId = searchParams.get("channelId")
    const taskThreadId = searchParams.get("taskThreadId")

    let messages

    if (channelId) {
      messages = await prisma.message.findMany({
        where: { channelId },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      })
    } else if (taskThreadId) {
      messages = await prisma.message.findMany({
        where: { taskThreadId },
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "asc" },
      })
    } else {
      return NextResponse.json(
        { error: "Channel ID or Task Thread ID required" },
        { status: 400 }
      )
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, channelId, taskThreadId } = body

    if (!content || (!channelId && !taskThreadId)) {
      return NextResponse.json(
        { error: "Content and either channelId or taskThreadId required" },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        content,
        authorId: session.user.id,
        ...(channelId && { channelId }),
        ...(taskThreadId && { taskThreadId }),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
