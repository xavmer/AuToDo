import { NextResponse } from "next/server"
import { requireRole, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole, ProjectStatus } from "@prisma/client"
import { logActivity } from "@/lib/activity"
import { z } from "zod"

const CreateProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  managerId: z.string(),
  prompt: z.string().optional(),
})

async function handleGET(req: Request) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])

  let projects

  if (user.role === UserRole.EXECUTIVE) {
    // Executives see all projects
    projects = await prisma.project.findMany({
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  } else if (user.role === UserRole.MANAGER) {
    // Managers see only projects they manage
    projects = await prisma.project.findMany({
      where: {
        managerId: user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  } else {
    // Employees see projects with tasks assigned to them
    projects = await prisma.project.findMany({
      where: {
        tasks: {
          some: {
            assigneeUserId: user.id,
          },
        },
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        tasks: {
          where: { assigneeUserId: user.id },
          select: {
            id: true,
            status: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }

  return NextResponse.json({ projects })
}

async function handlePOST(req: Request) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER])
  const body = await req.json()

  const validated = CreateProjectSchema.parse(body)

  const project = await prisma.project.create({
    data: {
      title: validated.title,
      description: validated.description,
      prompt: validated.prompt,
      createdById: user.id,
      managerId: validated.managerId,
      status: ProjectStatus.PLANNING,
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true, email: true } },
    },
  })

  // Create default channel
  await prisma.channel.create({
    data: {
      projectId: project.id,
      name: "general",
    },
  })

  await logActivity({
    actorId: user.id,
    entityType: "project",
    entityId: project.id,
    action: "created",
    payload: { title: project.title },
  })

  return NextResponse.json({ project }, { status: 201 })
}

export const GET = withErrorHandling(handleGET)
export const POST = withErrorHandling(handlePOST)
