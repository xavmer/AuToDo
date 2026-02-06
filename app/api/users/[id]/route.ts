import { NextResponse } from "next/server"
import { requireRole, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"

async function handleGET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])

  const profile = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      employeeProfile: {
        select: {
          skills: true,
          weaknesses: true,
          capacityHoursPerWeek: true,
          seniority: true,
          preferences: true,
        },
      },
      assignedTasks: {
        where: {
          status: { in: ["NOT_STARTED", "IN_PROGRESS", "BLOCKED"] },
        },
        select: {
          id: true,
          title: true,
          status: true,
          estimatedEffortHours: true,
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      managedProjects: {
        where: {
          status: { in: ["PLANNING", "ACTIVE"] },
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ user: profile })
}

export const GET = withErrorHandling(handleGET)
