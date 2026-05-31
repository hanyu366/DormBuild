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

    const messages = await prisma.anonymousMessage.findMany({
      where: { dormId: user.dormId },
      orderBy: { createdAt: 'desc' },
    })

    res.json(messages)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取匿名消息失败' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const { content } = req.body
    if (!content) {
      res.status(400).json({ error: '内容不能为空' })
      return
    }

    const message = await prisma.anonymousMessage.create({
      data: {
        dormId: user.dormId,
        content,
      },
    })

    res.status(201).json(message)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '创建匿名消息失败' })
  }
})

router.post('/:id/like', async (req: AuthRequest, res) => {
  try {
    const message = await prisma.anonymousMessage.findUnique({
      where: { id: req.params.id },
    })

    if (!message) {
      res.status(404).json({ error: '消息不存在' })
      return
    }

    const updated = await prisma.anonymousMessage.update({
      where: { id: req.params.id },
      data: { likes: message.likes + 1 },
    })

    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '点赞失败' })
  }
})

export default router
