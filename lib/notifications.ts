import { prisma } from "@/lib/db"

interface CreateNotificationParams {
  userId: string
  type: "assignment" | "mention" | "status_change"
  payload: Record<string, any>
}

export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      payload: params.payload,
      read: false,
    },
  })
}

export async function createNotifications(notifications: CreateNotificationParams[]) {
  return prisma.notification.createMany({
    data: notifications.map((n) => ({
      userId: n.userId,
      type: n.type,
      payload: n.payload,
      read: false,
    })),
  })
}

export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}

/**
 * Parse @mentions from message body
 * Returns array of userIds mentioned
 */
export function parseMentions(body: string, allUsers: { id: string; name: string }[]): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(body)) !== null) {
    const mentionedName = match[1]
    const user = allUsers.find(
      (u) => u.name.toLowerCase().replace(/\s/g, "") === mentionedName.toLowerCase()
    )
    if (user) {
      mentions.push(user.id)
    }
  }

  return mentions
}
