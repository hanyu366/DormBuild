import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(err)

  const message = err.message || '服务器内部错误'

  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({ error: message, stack: err.stack })
  } else {
    res.status(500).json({ error: message })
  }
}
