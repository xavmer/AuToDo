import { NextResponse } from "next/server"
import { requireRole, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"

async function handleGET(req: Request) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER])

  const managers = await prisma.user.findMany({
    where: {
      role: UserRole.MANAGER,
    },
    select: {
      id: true,
      name: true,
      email: true,
      teamId: true,
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ managers })
}

export const GET = withErrorHandling(handleGET)
