import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dormbuild-secret'

router.post('/register', async (req: AuthRequest, res) => {
  try {
    const { nickname, password } = req.body
    if (!nickname || !password) {
      res.status(400).json({ error: '昵称和密码不能为空' })
      return
    }

    const existing = await prisma.user.findFirst({ where: { nickname } })
    if (existing) {
      res.status(409).json({ error: '该昵称已被注册' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { nickname, passwordHash },
    })

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.status(201).json({ token, user: { id: user.id, nickname: user.nickname, avatar: user.avatar, dormId: user.dormId } })
  } catch (error: any) {
    res.status(500).json({ error: error.message || '注册失败' })
  }
})

router.post('/login', async (req: AuthRequest, res) => {
  try {
    const { nickname, password } = req.body
    if (!nickname || !password) {
      res.status(400).json({ error: '昵称和密码不能为空' })
      return
    }

    const user = await prisma.user.findFirst({
      where: { nickname },
      include: { dorm: true },
    })

    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' })
      return
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      res.status(401).json({ error: '用户名或密码错误' })
      return
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' })
    res.json({
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        dormId: user.dormId,
        dorm: user.dorm,
      },
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message || '登录失败' })
  }
})

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { dorm: true },
    })

    if (!user) {
      res.status(404).json({ error: '用户不存在' })
      return
    }

    res.json({
      id: user.id,
      nickname: user.nickname,
      avatar: user.avatar,
      dormId: user.dormId,
      dorm: user.dorm,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取用户信息失败' })
  }
})

export default router
