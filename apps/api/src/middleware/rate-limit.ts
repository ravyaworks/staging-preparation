import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

export function createRateLimiter(options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs ?? 60000,
    max: options.max ?? 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: options.message ?? 'Too many requests, please try again later',
    skipFailedRequests: options.skipFailedRequests ?? false,
    keyGenerator: options.keyGenerator ?? ((req) => {
      const forwarded = req.headers['x-forwarded-for'];
      const ip = typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : req.ip;
      const auth = (req as Request & { auth?: { userId?: string } }).auth;
      return auth?.userId ?? ip ?? 'unknown';
    }),
  });
}

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts, please try again later',
});

export const apiLimiter = createRateLimiter({
  windowMs: 60000,
  max: 100,
  message: 'Too many requests',
});
