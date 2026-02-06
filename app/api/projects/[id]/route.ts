import { NextResponse } from "next/server"
import { requireRole, assertProjectAccess, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"

async function handleGET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])
  await assertProjectAccess(user.id, user.role, params.id, user.teamId)

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { id: true, name: true, email: true, role: true } },
      manager: { select: { id: true, name: true, email: true, role: true } },
      tasks: {
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      channels: {
        include: {
          messages: {
            include: {
              sender: { select: { id: true, name: true, email: true } },
            },
            orderBy: { createdAt: "asc" },
            take: 50,
          },
        },
      },
    },
  })

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 })
  }

  return NextResponse.json({ project })
}

async function handlePATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER])
  await assertProjectAccess(user.id, user.role, params.id, user.teamId)

  const body = await req.json()
  const { title, description, status } = body

  const updatedProject = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
    },
  })

  return NextResponse.json({ project: updatedProject })
}

export const GET = withErrorHandling(handleGET)
export const PATCH = withErrorHandling(handlePATCH)
