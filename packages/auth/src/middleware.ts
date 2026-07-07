import type { Request, Response, NextFunction } from 'express';
import type { JwtConfig } from './jwt';
import { createJwtHandler } from './jwt';
import type { AuthContext } from './types';

export function authenticate(jwtConfig: JwtConfig) {
  const jwt = createJwtHandler(jwtConfig);

  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next(new Error('Authentication required'));
      return;
    }

    const token = authHeader.slice(7);

    try {
      const payload = jwt.verifyAccessToken(token);

      const authContext: AuthContext = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sub,
      };

      (req as Request & { auth: AuthContext }).auth = authContext;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  };
}

export function optionalAuth(jwtConfig: JwtConfig) {
  const jwt = createJwtHandler(jwtConfig);

  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.slice(7);

    try {
      const payload = jwt.verifyAccessToken(token);
      (req as Request & { auth: AuthContext }).auth = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sub,
      };
    } catch {
      // ignore invalid tokens for optional auth
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const auth = (req as Request & { auth?: AuthContext }).auth;

    if (!auth) {
      next(new Error('Authentication required'));
      return;
    }

    if (!roles.includes(auth.role)) {
      next(new Error('Insufficient permissions'));
      return;
    }

    next();
  };
}

export function extractTenantId(headerName = 'x-tenant-id') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const tenantId = req.headers[headerName.toLowerCase()] as string | undefined;

    if (tenantId) {
      (req as Request & { tenantId?: string }).tenantId = tenantId;
    }

    next();
  };
}
