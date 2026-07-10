import type { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';

interface ApiKeyStore {
  validateKey(rawKey: string): { tenantId: string; scopes: string[] } | null;
}

const inMemoryKeys = new Map<string, { tenantId: string; scopes: string[] }>();

export function registerApiKey(rawKey: string, tenantId: string, scopes: string[]): void {
  const hash = createHash('sha256').update(rawKey).digest('hex');
  inMemoryKeys.set(hash, { tenantId, scopes });
}

const store: ApiKeyStore = {
  validateKey(rawKey: string) {
    const hash = createHash('sha256').update(rawKey).digest('hex');
    return inMemoryKeys.get(hash) ?? null;
  },
};

export function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.status(401).json({ success: false, error: 'Missing Authorization header' });
    return;
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    res.status(401).json({ success: false, error: 'Invalid Authorization format. Use: Bearer <token>' });
    return;
  }

  const validated = store.validateKey(token);
  if (!validated) {
    res.status(401).json({ success: false, error: 'Invalid API key' });
    return;
  }

  (req as any).tenantId = validated.tenantId;
  (req as any).apiKeyScopes = validated.scopes;
  next();
}

export function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const scopes: string[] = (req as any).apiKeyScopes || [];
    if (scopes.includes('*') || scopes.includes(scope)) {
      next();
      return;
    }
    res.status(403).json({ success: false, error: `Missing required scope: ${scope}` });
  };
}
