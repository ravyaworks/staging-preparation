import type { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

export function etagMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'GET') return next()

  const originalEnd = res.end.bind(res)
  const chunks: Buffer[] = []

  res.write = (chunk: unknown) => {
    if (typeof chunk === 'string') chunks.push(Buffer.from(chunk))
    else if (chunk instanceof Buffer) chunks.push(chunk)
    else if (chunk instanceof Uint8Array) chunks.push(Buffer.from(chunk))
    return true
  }

  res.end = (chunk?: unknown) => {
    if (chunk) {
      if (typeof chunk === 'string') chunks.push(Buffer.from(chunk))
      else if (chunk instanceof Buffer) chunks.push(chunk)
    }

    const body = Buffer.concat(chunks)
    const hash = crypto.createHash('md5').update(body).digest('hex')
    const etag = `"${hash}"`

    res.setHeader('ETag', etag)
    res.setHeader('Cache-Control', 'no-cache')

    if (req.headers['if-none-match'] === etag) {
      res.statusCode = 304
      res.removeHeader('content-type')
      res.removeHeader('content-length')
      return originalEnd()
    }

    return originalEnd(chunk)
  }

  next()
}
