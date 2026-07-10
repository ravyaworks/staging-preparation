import type { Request, Response, NextFunction } from 'express';

const ALLOWED_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }

  if (ALLOWED_METHODS.includes(req.method)) {
    next();
    return;
  }

  const origin = req.headers['origin'];
  const referer = req.headers['referer'];
  const contentType = req.headers['content-type'];

  if (!origin && !referer) {
    if (contentType === 'application/json') {
      next();
      return;
    }
    res.status(403).json({
      success: false,
      error: { code: 'CSRF_REQUIRED', message: 'Origin or Referer header required' },
    });
    return;
  }

  next();
}
