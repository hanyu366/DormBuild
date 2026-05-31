import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const notifications = await prisma.notification.findMany({
      where: {
        dormId: user.dormId,
        OR: [{ userId: null }, { userId: req.userId }],
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(notifications)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取通知失败' })
  }
})

router.patch('/:id/read', async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    })

    if (!notification) {
      res.status(404).json({ error: '通知不存在' })
      return
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    })

    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '标记已读失败' })
  }
})

router.patch('/read-all', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    await prisma.notification.updateMany({
      where: {
        dormId: user.dormId,
        OR: [{ userId: null }, { userId: req.userId }],
        read: false,
      },
      data: { read: true },
    })

    res.json({ message: '全部标记已读' })
  } catch (error: any) {
    res.status(500).json({ error: error.message || '标记全部已读失败' })
  }
})

export default router
