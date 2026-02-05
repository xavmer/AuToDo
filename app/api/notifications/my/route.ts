import { NextResponse } from "next/server"
import { requireRole, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"

async function handleGET(req: Request) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ notifications })
}

export const GET = withErrorHandling(handleGET)
