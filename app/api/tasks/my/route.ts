import { NextResponse } from "next/server"
import { requireRole, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"

async function handleGET(req: Request) {
  const user = await requireRole([UserRole.EMPLOYEE])

  const tasks = await prisma.task.findMany({
    where: {
      assigneeUserId: user.id,
    },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          manager: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      reviewer: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [
      { priority: "desc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  })

  return NextResponse.json({ tasks })
}

export const GET = withErrorHandling(handleGET)
