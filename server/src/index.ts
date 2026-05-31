import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import helmet from 'helmet'
import cron from 'node-cron'

import { initSocket } from './socket/index.js'
import { errorHandler } from './middleware/error.js'
import { refreshAllDorms } from './services/weather.service.js'
import { prisma } from './lib/prisma.js'

import authRoutes from './routes/auth.js'
import dormRoutes from './routes/dorm.js'
import expenseRoutes from './routes/expense.js'
import conventionRoutes from './routes/convention.js'
import dutyRoutes from './routes/duty.js'
import voteRoutes from './routes/vote.js'
import anonymousRoutes from './routes/anonymous.js'
import notificationRoutes from './routes/notification.js'
import weatherRoutes from './routes/weather.js'
import aiRoutes from './routes/ai.js'

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
})

initSocket(io)

app.use(cors())
app.use(helmet())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/dorm', dormRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/conventions', conventionRoutes)
app.use('/api/duties', dutyRoutes)
app.use('/api/votes', voteRoutes)
app.use('/api/anonymous', anonymousRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/weather', weatherRoutes)
app.use('/api/ai', aiRoutes)

app.use(errorHandler)

cron.schedule('0 */3 * * *', async () => {
  try {
    await refreshAllDorms()
  } catch (e) {
    console.error('定时刷新天气失败:', e)
  }
})

cron.schedule('0 8 * * *', async () => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const duties = await prisma.dutySchedule.findMany({
      where: {
        dutyDate: { gte: today, lt: tomorrow },
        completed: false,
      },
      include: { user: true, dorm: true },
    })

    for (const duty of duties) {
      const { createNotification } = await import('./services/notification.service.js')
      await createNotification(
        duty.dormId,
        duty.userId,
        'duty',
        '值日提醒',
        `今天轮到 ${duty.user.nickname} 值日: ${duty.dutyType}`
      )
    }
  } catch (e) {
    console.error('值日提醒失败:', e)
  }
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
})
