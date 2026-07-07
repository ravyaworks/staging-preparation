import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
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
    validate: { xForwardedForHeader: false },
    keyGenerator: options.keyGenerator ?? ((req) => {
      const auth = (req as Request & { auth?: { userId?: string } }).auth;
      return auth?.userId ?? ipKeyGenerator(req.ip ?? 'unknown');
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
