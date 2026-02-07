import { NextResponse } from "next/server"
import { requireRole, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"

async function handleGET(req: Request) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])

  const users = await prisma.user.findMany({
    where: {
      NOT: {
        id: user.id,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      teamId: true,
      avatarUrl: true,
    },
    orderBy: [
      { role: "asc" },
      { name: "asc" },
    ],
  })

  return NextResponse.json(users)
}

export const GET = withErrorHandling(handleGET)
