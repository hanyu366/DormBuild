import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dormbuild-secret'

let io: Server | null = null

export function initSocket(ioInstance: Server) {
  io = ioInstance

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) {
      next(new Error('未提供认证令牌'))
      return
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
      ;(socket as any).userId = payload.userId
      next()
    } catch {
      next(new Error('认证令牌无效'))
    }
  })

  io.on('connection', (socket) => {
    const userId = (socket as any).userId
    socket.join(`user-${userId}`)

    socket.on('join-dorm', (dormId: string) => {
      socket.join(dormId)
    })

    socket.on('leave-dorm', (dormId: string) => {
      socket.leave(dormId)
    })

    socket.on('disconnect', () => {})
  })
}

export function getIO(): Server | null {
  return io
}
