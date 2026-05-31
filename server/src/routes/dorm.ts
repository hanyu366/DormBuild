import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { generateInviteCode } from '../lib/utils.js'

const router = Router()

router.use(authMiddleware)

router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name } = req.body
    if (!name) {
      res.status(400).json({ error: '宿舍名称不能为空' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (user?.dormId) {
      res.status(400).json({ error: '你已经加入了宿舍' })
      return
    }

    const inviteCode = generateInviteCode()
    const dorm = await prisma.dorm.create({
      data: { name, inviteCode },
    })

    await prisma.user.update({
      where: { id: req.userId },
      data: { dormId: dorm.id },
    })

    res.status(201).json(dorm)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '创建宿舍失败' })
  }
})

router.post('/join', async (req: AuthRequest, res) => {
  try {
    const { inviteCode } = req.body
    if (!inviteCode) {
      res.status(400).json({ error: '邀请码不能为空' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (user?.dormId) {
      res.status(400).json({ error: '你已经加入了宿舍' })
      return
    }

    const dorm = await prisma.dorm.findUnique({ where: { inviteCode } })
    if (!dorm) {
      res.status(404).json({ error: '邀请码无效' })
      return
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: { dormId: dorm.id },
    })

    res.json(dorm)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '加入宿舍失败' })
  }
})

router.get('/members', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const members = await prisma.user.findMany({
      where: { dormId: user.dormId },
      select: { id: true, nickname: true, avatar: true, createdAt: true },
    })

    res.json(members)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取成员列表失败' })
  }
})

router.put('/city', async (req: AuthRequest, res) => {
  try {
    const { city } = req.body
    if (!city) {
      res.status(400).json({ error: '城市不能为空' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const dorm = await prisma.dorm.update({
      where: { id: user.dormId },
      data: { city },
    })

    res.json(dorm)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '更新城市失败' })
  }
})

export default router
