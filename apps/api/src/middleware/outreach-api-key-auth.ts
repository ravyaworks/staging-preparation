import type { Request, Response, NextFunction } from 'express'
import type { PrismaClient } from '@prisma/client'
import type { Logger } from '@conversation-platform/logger'
import { ApiKeyService } from '@conversation-platform/outreach-integration'

export interface OutreachApiKeyAuthContext {
  organizationId: string
  tenantId?: string
}

declare global {
  namespace Express {
    interface Request {
      outreachApiKey?: OutreachApiKeyAuthContext
    }
  }
}

export function createOutreachApiKeyAuth(
  prisma: PrismaClient,
  logger: Logger,
) {
  const apiKeyService = new ApiKeyService(prisma, logger)

  return async function outreachApiKeyAuth(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      res.status(401).json({ success: false, error: 'Missing Authorization header' })
      return
    }

    const [scheme, token] = authHeader.split(' ')
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      res.status(401).json({ success: false, error: 'Invalid Authorization format. Use: Bearer <token>' })
      return
    }

    try {
      const result = await apiKeyService.validate(token)
      if (!result.valid) {
        res.status(401).json({ success: false, error: result.reason || 'Invalid API key' })
        return
      }

      req.outreachApiKey = {
        organizationId: result.organizationId!,
        tenantId: result.tenantId,
      }
      next()
    } catch (error) {
      logger.error({ error }, 'Outreach API key validation failed')
      res.status(500).json({ success: false, error: 'API key validation failed' })
    }
  }
}
