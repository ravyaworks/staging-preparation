import type { Request, Response, NextFunction } from 'express';

const requestCounts = new Map<string, { count: number; startTime: number }>();

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const method = req.method;
  const path = req.route?.path || req.path;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const key = `${method}:${path}`;

    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 0, startTime: Date.now() });
    }
    const entry = requestCounts.get(key)!;
    entry.count++;

    if (process.env.NODE_ENV === 'development') {
      const meta = {
        method, path, status, duration: `${duration}ms`,
        requestId: (req as any).requestId,
      };
    }
  });

  next();
}

export function getMetrics() {
  const now = Date.now();
  const summary: Record<string, { count: number; rps: number }> = {};

  for (const [key, entry] of requestCounts) {
    const elapsed = (now - entry.startTime) / 1000;
    summary[key] = {
      count: entry.count,
      rps: elapsed > 0 ? Math.round((entry.count / elapsed) * 100) / 100 : 0,
    };
  }

  return summary;
}

export function resetMetrics(): void {
  requestCounts.clear();
}
