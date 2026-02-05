import { NextResponse } from "next/server"
import { requireRole, withErrorHandling } from "@/lib/rbac"
import { prisma } from "@/lib/db"
import { UserRole } from "@prisma/client"
import { markNotificationAsRead } from "@/lib/notifications"

async function handlePATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireRole([UserRole.EXECUTIVE, UserRole.MANAGER, UserRole.EMPLOYEE])

  const notification = await prisma.notification.findUnique({
    where: { id: params.id },
  })

  if (!notification || notification.userId !== user.id) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 })
  }

  const updated = await markNotificationAsRead(params.id)

  return NextResponse.json({ notification: updated })
}

export const PATCH = withErrorHandling(handlePATCH)
