import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/channels?projectId=xxx - Get all channels for a project
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID required" },
        { status: 400 }
      )
    }

    const channels = await prisma.channel.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({ channels })
  } catch (error) {
    console.error("Error fetching channels:", error)
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    )
  }
}

// POST /api/channels - Create a new channel
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, name, description } = body

    if (!projectId || !name) {
      return NextResponse.json(
        { error: "Project ID and name required" },
        { status: 400 }
      )
    }

    const channel = await prisma.channel.create({
      data: {
        projectId,
        name,
        description,
      },
    })

    return NextResponse.json({ channel }, { status: 201 })
  } catch (error) {
    console.error("Error creating channel:", error)
    return NextResponse.json(
      { error: "Failed to create channel" },
      { status: 500 }
    )
  }
}
