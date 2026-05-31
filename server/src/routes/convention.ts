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

    const { type } = req.query
    const where: any = { dormId: user.dormId }
    if (type) where.type = type

    const conventions = await prisma.convention.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    })

    res.json(conventions)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取公约列表失败' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const { type, title, content, pinned, priority } = req.body
    if (!type || !title || !content) {
      res.status(400).json({ error: '类型、标题和内容不能为空' })
      return
    }

    const convention = await prisma.convention.create({
      data: {
        dormId: user.dormId,
        type,
        title,
        content,
        pinned: pinned ?? false,
        priority: priority ?? 0,
        createdBy: req.userId!,
      },
    })

    res.status(201).json(convention)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '创建公约失败' })
  }
})

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const convention = await prisma.convention.findUnique({
      where: { id: req.params.id },
    })

    if (!convention) {
      res.status(404).json({ error: '公约不存在' })
      return
    }

    const { type, title, content, pinned, priority } = req.body
    const updated = await prisma.convention.update({
      where: { id: req.params.id },
      data: {
        ...(type !== undefined && { type }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(pinned !== undefined && { pinned }),
        ...(priority !== undefined && { priority }),
      },
    })

    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '更新公约失败' })
  }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const convention = await prisma.convention.findUnique({
      where: { id: req.params.id },
    })

    if (!convention) {
      res.status(404).json({ error: '公约不存在' })
      return
    }

    await prisma.convention.delete({ where: { id: req.params.id } })
    res.json({ message: '删除成功' })
  } catch (error: any) {
    res.status(500).json({ error: error.message || '删除公约失败' })
  }
})

router.patch('/:id/pin', async (req: AuthRequest, res) => {
  try {
    const convention = await prisma.convention.findUnique({
      where: { id: req.params.id },
    })

    if (!convention) {
      res.status(404).json({ error: '公约不存在' })
      return
    }

    const updated = await prisma.convention.update({
      where: { id: req.params.id },
      data: { pinned: !convention.pinned },
    })

    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '置顶操作失败' })
  }
})

export default router
