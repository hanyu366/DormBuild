import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { createChat, parseExpense, parseDuty } from '../services/ai.service.js'

const router = Router()

router.use(authMiddleware)

router.post('/chat', async (req: AuthRequest, res) => {
  try {
    const { messages } = req.body
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: '消息列表不能为空' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { dorm: { include: { members: true } } },
    })

    let dormContext = ''
    if (user?.dorm) {
      dormContext = `宿舍名: ${user.dorm.name}, 成员: ${user.dorm.members.map((m) => m.nickname).join('、')}`
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const stream = createChat(messages, dormContext)
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`)
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'AI对话失败' })
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'AI对话失败' })}\n\n`)
      res.end()
    }
  }
})

router.post('/parse-expense', async (req: AuthRequest, res) => {
  try {
    const { text } = req.body
    if (!text) {
      res.status(400).json({ error: '文本不能为空' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const members = await prisma.user.findMany({
      where: { dormId: user.dormId },
      select: { id: true, nickname: true },
    })

    const result = await parseExpense(text, members)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '解析费用失败' })
  }
})

router.post('/parse-duty', async (req: AuthRequest, res) => {
  try {
    const { text } = req.body
    if (!text) {
      res.status(400).json({ error: '文本不能为空' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const members = await prisma.user.findMany({
      where: { dormId: user.dormId },
      select: { id: true, nickname: true },
    })

    const result = await parseDuty(text, members)
    res.json(result)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '解析值日失败' })
  }
})

export default router
