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

    const votes = await prisma.vote.findMany({
      where: { dormId: user.dormId },
      include: {
        options: { include: { records: true } },
        records: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(votes)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取投票列表失败' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const { title, description, isAnonymous, multiChoice, deadline, options } = req.body
    if (!title || !options || options.length === 0) {
      res.status(400).json({ error: '标题和选项不能为空' })
      return
    }

    const vote = await prisma.vote.create({
      data: {
        dormId: user.dormId,
        title,
        description,
        isAnonymous: isAnonymous ?? false,
        multiChoice: multiChoice ?? false,
        deadline: deadline ? new Date(deadline) : null,
        createdBy: req.userId!,
        options: {
          create: options.map((content: string) => ({ content })),
        },
      },
      include: { options: true },
    })

    res.status(201).json(vote)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '创建投票失败' })
  }
})

router.post('/:id/vote', async (req: AuthRequest, res) => {
  try {
    const vote = await prisma.vote.findUnique({
      where: { id: req.params.id },
      include: { options: true },
    })

    if (!vote) {
      res.status(404).json({ error: '投票不存在' })
      return
    }

    if (vote.deadline && new Date() > vote.deadline) {
      res.status(400).json({ error: '投票已截止' })
      return
    }

    const { optionIds } = req.body
    if (!optionIds || optionIds.length === 0) {
      res.status(400).json({ error: '请选择投票选项' })
      return
    }

    if (!vote.multiChoice && optionIds.length > 1) {
      res.status(400).json({ error: '该投票不支持多选' })
      return
    }

    const existingRecord = await prisma.voteRecord.findFirst({
      where: {
        voteId: vote.id,
        userId: req.userId,
      },
    })

    if (existingRecord) {
      res.status(400).json({ error: '你已经投过票了' })
      return
    }

    const records = await prisma.voteRecord.createMany({
      data: optionIds.map((optionId: string) => ({
        voteId: vote.id,
        optionId,
        userId: vote.isAnonymous ? null : req.userId,
      })),
    })

    res.status(201).json({ count: records.count })
  } catch (error: any) {
    res.status(500).json({ error: error.message || '投票失败' })
  }
})

router.get('/:id/result', async (req: AuthRequest, res) => {
  try {
    const vote = await prisma.vote.findUnique({
      where: { id: req.params.id },
      include: {
        options: {
          include: { records: true },
        },
      },
    })

    if (!vote) {
      res.status(404).json({ error: '投票不存在' })
      return
    }

    const totalRecords = vote.options.reduce((sum, o) => sum + o.records.length, 0)
    const result = vote.options.map((option) => ({
      id: option.id,
      content: option.content,
      count: option.records.length,
      percentage: totalRecords > 0 ? Math.round((option.records.length / totalRecords) * 100) : 0,
    }))

    res.json({
      id: vote.id,
      title: vote.title,
      totalVotes: totalRecords,
      options: result,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取投票结果失败' })
  }
})

export default router
