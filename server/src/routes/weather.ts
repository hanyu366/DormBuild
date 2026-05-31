import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authMiddleware, AuthRequest } from '../middleware/auth.js'
import { fetchWeather, generateAdvice } from '../services/weather.service.js'

const router = Router()

router.use(authMiddleware)

router.get('/', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    const dorm = await prisma.dorm.findUnique({ where: { id: user.dormId } })
    if (!dorm) {
      res.status(404).json({ error: '宿舍不存在' })
      return
    }

    let cache = await prisma.weatherCache.findUnique({ where: { dormId: dorm.id } })

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    if (!cache || cache.updatedAt < oneHourAgo) {
      const weather = await fetchWeather(dorm.city, dorm.id)
      res.json(weather)
      return
    }

    const current = JSON.parse(cache.current)
    const forecast = JSON.parse(cache.forecast)

    res.json({ current, forecast, updatedAt: cache.updatedAt })
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取天气失败' })
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

router.get('/advice', async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user?.dormId) {
      res.status(400).json({ error: '你还未加入宿舍' })
      return
    }

    let cache = await prisma.weatherCache.findUnique({ where: { dormId: user.dormId } })

    if (!cache) {
      const dorm = await prisma.dorm.findUnique({ where: { id: user.dormId } })
      if (!dorm) {
        res.status(404).json({ error: '宿舍不存在' })
        return
      }
      const weather = await fetchWeather(dorm.city, dorm.id)
      cache = await prisma.weatherCache.findUnique({ where: { dormId: user.dormId } })
    }

    if (!cache) {
      res.status(500).json({ error: '获取天气数据失败' })
      return
    }

    const current = JSON.parse(cache.current)
    const forecast = JSON.parse(cache.forecast)
    const advice = generateAdvice(current, forecast)

    res.json(advice)
  } catch (error: any) {
    res.status(500).json({ error: error.message || '获取建议失败' })
  }
})

export default router
