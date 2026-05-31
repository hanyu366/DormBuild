import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { createNotification } from '../services/notification.service.js'
import { getIO } from '../socket/index.js'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const { category, from, to } = req.query
    const where: any = { dormId: user.dormId }
    if (category) where.category = category
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from as string)
      if (to) where.createdAt.lte = new Date(to as string)
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { splits: true },
      orderBy: { createdAt: 'desc' },
    })

    res.json(expenses)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取费用列表失败' })
  }
})

router.post('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const { title, amount, category, splitMethod, note, splits } = req.body
    if (!title || !amount || !category) {
      res.status(400).json({ error: '标题、金额和分类不能为空' })
      return
    }

    const expense = await prisma.expense.create({
      data: {
        dormId: user.dormId,
        payerId: req.userId!,
        title,
        amount: parseFloat(amount),
        category,
        splitMethod: splitMethod || 'equal',
        note,
        splits: {
          create: (splits || []).map((s: any) => ({
            userId: s.userId,
            amount: parseFloat(s.amount),
          })),
        },
      },
      include: { splits: true },
    })

    await createNotification(
      user.dormId,
      null,
      'expense',
      '新费用',
      `${user.nickname} 添加了费用: ${title} ¥${amount}`
    )

    const io = getIO()
    if (io) {
      io.to(user.dormId).emit('expense-created', expense)
    }

    res.status(201).json(expense)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '创建费用失败' })
  }
})

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
    })

    if (!expense) {
      res.status(404).json({ error: '费用不存在' })
      return
    }

    if (expense.payerId !== req.userId) {
      res.status(403).json({ error: '只能删除自己创建的费用' })
      return
    }

    await prisma.expenseSplit.deleteMany({ where: { expenseId: expense.id } })
    await prisma.expense.delete({ where: { id: expense.id } })

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (user?.dormId) {
      const io = getIO()
      if (io) {
        io.to(user.dormId).emit('expense-deleted', { id: expense.id })
      }
    }

    res.json({ message: '删除成功' })
  } catch (error: any) {
    res.status(500).json({ error: error.message || '删除费用失败' })
  }
})

router.get('/balance', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const members = await prisma.user.findMany({
      where: { dormId: user.dormId },
      select: { id: true, nickname: true },
    })

    const expenses = await prisma.expense.findMany({
      where: { dormId: user.dormId },
      include: { splits: true },
    })

    const balance: Record<string, number> = {}
    members.forEach((m) => (balance[m.id] = 0))

    for (const expense of expenses) {
      balance[expense.payerId] = (balance[expense.payerId] || 0) + expense.amount
      for (const split of expense.splits) {
        balance[split.userId] = (balance[split.userId] || 0) - split.amount
      }
    }

    const result = members.map((m) => ({
      userId: m.id,
      nickname: m.nickname,
      balance: Math.round((balance[m.id] || 0) * 100) / 100,
    }))

    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取余额失败' })
  }
})

router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const expenses = await prisma.expense.findMany({
      where: { dormId: user.dormId },
    })

    const total = expenses.reduce((sum, e) => sum + e.amount, 0)
    const byCategory: Record<string, number> = {}
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount
    })

    const now = new Date()
    const thisMonth = expenses.filter((e) => {
      const d = new Date(e.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const monthTotal = thisMonth.reduce((sum, e) => sum + e.amount, 0)

    res.json({
      total: Math.round(total * 100) / 100,
      monthTotal: Math.round(monthTotal * 100) / 100,
      count: expenses.length,
      byCategory,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取统计失败' })
  }
})

export default router
