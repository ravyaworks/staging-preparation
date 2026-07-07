import type { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators';

interface AuthService {
  register(params: { email: string; password: string; firstName: string; lastName: string; tenantName: string; tenantSlug: string }): Promise<unknown>;
  login(params: { email: string; password: string }): Promise<unknown>;
  refreshTokens(refreshToken: string): Promise<unknown>;
  logout(sessionId: string): Promise<void>;
  getUserById(userId: string): Promise<unknown>;
}

export function createAuthController(authService: AuthService) {
  return {
    async register(req: Request, res: Response, next: NextFunction) {
      try {
        const parsed = registerSchema.parse(req.body);
        const result = await authService.register(parsed);

        res.status(201).json({
          success: true,
          data: result,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        next(error);
      }
    },

    async login(req: Request, res: Response, next: NextFunction) {
      try {
        const parsed = loginSchema.parse(req.body);
        const result = await authService.login(parsed);

        res.json({
          success: true,
          data: result,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        next(error);
      }
    },

    async refresh(req: Request, res: Response, next: NextFunction) {
      try {
        const parsed = refreshTokenSchema.parse(req.body);
        const result = await authService.refreshTokens(parsed.refreshToken);

        res.json({
          success: true,
          data: result,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        next(error);
      }
    },

    async logout(req: Request, res: Response, next: NextFunction) {
      try {
        const sessionId = req.body.sessionId;
        if (sessionId) {
          await authService.logout(sessionId);
        }

        res.json({
          success: true,
          data: { message: 'Logged out successfully' },
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        next(error);
      }
    },

    async me(req: Request, res: Response, next: NextFunction) {
      try {
        const auth = (req as Request & { auth?: { userId: string } }).auth;
        if (!auth) {
          res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
          return;
        }

        const user = await authService.getUserById(auth.userId);
        if (!user) {
          res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
          return;
        }

        res.json({
          success: true,
          data: user,
          meta: { timestamp: new Date().toISOString() },
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
