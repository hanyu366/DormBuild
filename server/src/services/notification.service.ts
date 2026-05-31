import { prisma } from '../lib/prisma.js'
import { getIO } from '../socket/index.js'

export async function createNotification(
  dormId: string,
  userId: string | null,
  type: string,
  title: string,
  content: string
) {
  const notification = await prisma.notification.create({
    data: { dormId, userId, type, title, content },
  })

  const io = getIO()
  if (io) {
    io.to(dormId).emit('notification', notification)
    if (userId) {
      io.to(`user-${userId}`).emit('notification', notification)
    }
  }

  return notification
}
