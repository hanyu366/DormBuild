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

    const { from, to } = req.query
    const where: any = { dormId: user.dormId }
    if (from || to) {
      where.dutyDate = {}
      if (from) where.dutyDate.gte = new Date(from as string)
      if (to) where.dutyDate.lte = new Date(to as string)
    }

    const duties = await prisma.dutySchedule.findMany({
      where,
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
      orderBy: { dutyDate: 'asc' },
    })

    res.json(duties)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取值日列表失败' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const { userId, dutyDate, dutyType } = req.body
    if (!userId || !dutyDate || !dutyType) {
      res.status(400).json({ error: '成员、日期和类型不能为空' })
      return
    }

    const duty = await prisma.dutySchedule.create({
      data: {
        dormId: user.dormId,
        userId,
        dutyDate: new Date(dutyDate),
        dutyType,
      },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
    })

    res.status(201).json(duty)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '创建值日失败' })
  }
})

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const duty = await prisma.dutySchedule.findUnique({
      where: { id: req.params.id },
    })

    if (!duty) {
      res.status(404).json({ error: '值日记录不存在' })
      return
    }

    const { completed, dutyType, dutyDate } = req.body
    const updated = await prisma.dutySchedule.update({
      where: { id: req.params.id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(dutyType !== undefined && { dutyType }),
        ...(dutyDate !== undefined && { dutyDate: new Date(dutyDate) }),
      },
      include: { user: { select: { id: true, nickname: true, avatar: true } } },
    })

    res.json(updated)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '更新值日失败' })
  }
})

router.post('/auto-schedule', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const { days = 7, dutyType = '日常值日' } = req.body

    const members = await prisma.user.findMany({
      where: { dormId: user.dormId },
      select: { id: true, nickname: true },
    })

    if (members.length === 0) {
      res.status(400).json({ error: '宿舍没有成员' })
      return
    }

    const duties = []
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 1)

    for (let i = 0; i < days; i++) {
      const dutyDate = new Date(startDate)
      dutyDate.setDate(dutyDate.getDate() + i)
      const member = members[i % members.length]

      const existing = await prisma.dutySchedule.findFirst({
        where: {
          dormId: user.dormId,
          dutyDate: {
            gte: new Date(dutyDate.setHours(0, 0, 0, 0)),
            lt: new Date(dutyDate.setHours(23, 59, 59, 999)),
          },
        },
      })

      if (!existing) {
        const duty = await prisma.dutySchedule.create({
          data: {
            dormId: user.dormId,
            userId: member.id,
            dutyDate: new Date(startDate.getTime() + i * 86400000),
            dutyType,
          },
          include: { user: { select: { id: true, nickname: true, avatar: true } } },
        })
        duties.push(duty)
      }
    }

    res.status(201).json(duties)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '自动排班失败' })
  }
})

export default router
