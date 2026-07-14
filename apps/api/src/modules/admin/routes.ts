import { Router, type Request, type Response, type NextFunction } from 'express';
import type { AppConfig } from '@conversation-platform/config';
import type { Logger } from '@conversation-platform/logger';
import { authenticate } from '@conversation-platform/auth';
import type { AuthContext } from '@conversation-platform/auth';
import { getPrismaClient } from '@conversation-platform/database';
import { AdministrationService, type Permission } from '@conversation-platform/administration';

type AuthReq = Request & { auth: AuthContext }
function ctx(req: Request): AuthContext { return (req as AuthReq).auth }
function clientIp(req: Request): string | undefined { return req.ip ?? undefined }
function param(req: Request, name: string): string { return (req.params as Record<string, string>)[name] ?? '' }

let _admin: AdministrationService | null = null
function admin(): AdministrationService {
  if (!_admin) _admin = new AdministrationService(getPrismaClient())
  return _admin
}

function requirePerm(permission: Permission) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await admin().rbac.requirePermission(ctx(req).userId, ctx(req).tenantId, permission)
      next()
    } catch (err) { next(err) }
  }
}

export function createAdminRoutes(config: AppConfig, _logger: Logger): Router {
  const router = Router()
  const jwtCfg = { secret: config.auth.jwtSecret, expiresIn: 900, refreshSecret: config.auth.refreshSecret, refreshExpiresIn: 604800, issuer: config.auth.issuer }
  const auth = authenticate(jwtCfg)

  // ── System Health ────────────────────────────────────────────────
  router.get('/system/health', auth, requirePerm('health:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const health = await admin().health.check()
      const metrics = await admin().health.getAdminMetrics()
      res.json({ success: true, data: { ...health, metrics } })
    } catch (err) { next(err) }
  })

  // ── Organizations ────────────────────────────────────────────────
  router.get('/organizations', auth, requirePerm('organization:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().organizations.list(ctx(req).tenantId, Number(req.query.page) || 1, Number(req.query.limit) || 20) }) }
    catch (err) { next(err) }
  })

  router.post('/organizations', auth, requirePerm('organization:create'), async (req: Request, res: Response, next: NextFunction) => {
    try { const org = await admin().organizations.create(req.body, ctx(req).tenantId, ctx(req).userId, clientIp(req)); res.status(201).json({ success: true, data: org }) }
    catch (err) { next(err) }
  })

  router.get('/organizations/:id', auth, requirePerm('organization:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().organizations.getById(param(req, 'id'), ctx(req).tenantId) }) }
    catch (err) { next(err) }
  })

  router.patch('/organizations/:id', auth, requirePerm('organization:update'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().organizations.update(param(req, 'id'), req.body, ctx(req).tenantId, ctx(req).userId, clientIp(req)) }) }
    catch (err) { next(err) }
  })

  router.post('/organizations/:id/suspend', auth, requirePerm('organization:suspend'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().organizations.suspend(param(req, 'id'), ctx(req).tenantId, ctx(req).userId, clientIp(req)) }) }
    catch (err) { next(err) }
  })

  router.post('/organizations/:id/reactivate', auth, requirePerm('organization:reactivate'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().organizations.reactivate(param(req, 'id'), ctx(req).tenantId, ctx(req).userId, clientIp(req)) }) }
    catch (err) { next(err) }
  })

  router.get('/organizations/:id/stats', auth, requirePerm('organization:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().organizations.getStats(param(req, 'id'), ctx(req).tenantId) }) }
    catch (err) { next(err) }
  })

  // ── Users ────────────────────────────────────────────────────────
  router.get('/users', auth, requirePerm('user:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().users.list(ctx(req).tenantId, req.query.organizationId as string | undefined, Number(req.query.page) || 1, Number(req.query.limit) || 20) }) }
    catch (err) { next(err) }
  })

  router.get('/users/:id', auth, requirePerm('user:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().users.getById(param(req, 'id'), ctx(req).tenantId) }) }
    catch (err) { next(err) }
  })

  router.post('/users/invite', auth, requirePerm('user:invite'), async (req: Request, res: Response, next: NextFunction) => {
    try { const user = await admin().users.invite(req.body, ctx(req).tenantId, ctx(req).userId, clientIp(req)); res.status(201).json({ success: true, data: user }) }
    catch (err) { next(err) }
  })

  router.post('/users/:id/suspend', auth, requirePerm('user:suspend'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().users.suspend(param(req, 'id'), ctx(req).tenantId, ctx(req).userId, clientIp(req)) }) }
    catch (err) { next(err) }
  })

  router.post('/users/:id/force-logout', auth, requirePerm('user:force-logout'), async (req: Request, res: Response, next: NextFunction) => {
    try { await admin().users.forceLogout(param(req, 'id'), ctx(req).tenantId, ctx(req).userId, clientIp(req)); res.json({ success: true, message: 'User logged out from all sessions' }) }
    catch (err) { next(err) }
  })

  router.post('/users/:id/assign-role', auth, requirePerm('user:assign-role'), async (req: Request, res: Response, next: NextFunction) => {
    try { await admin().users.assignRole(param(req, 'id'), req.body.roleSlug, ctx(req).tenantId, ctx(req).userId, clientIp(req)); res.json({ success: true, message: 'Role assigned' }) }
    catch (err) { next(err) }
  })

  router.get('/users/:id/activity', auth, requirePerm('user:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().users.getActivity(param(req, 'id'), ctx(req).tenantId) }) }
    catch (err) { next(err) }
  })

  // ── Roles ────────────────────────────────────────────────────────
  router.get('/roles', auth, requirePerm('role:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prisma = getPrismaClient()
      const roles = await prisma.role.findMany({
        where: { OR: [{ tenantId: ctx(req).tenantId }, { tenantId: null }] },
        include: { rolePermissions: { include: { permission: true } }, _count: { select: { userRoles: true } } },
        orderBy: { createdAt: 'asc' },
      })
      res.json({ success: true, data: roles })
    } catch (err) { next(err) }
  })

  router.get('/roles/:id', auth, requirePerm('role:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await admin().rbac.getRoleWithPermissions(param(req, 'id'))
      if (!role) return res.status(404).json({ success: false, error: 'Role not found' })
      res.json({ success: true, data: role })
    } catch (err) { next(err) }
  })

  router.get('/permissions', auth, requirePerm('role:read'), (_req: Request, res: Response) => {
    res.json({ success: true, data: [
      'admin:access', 'organization:create', 'organization:read', 'organization:update', 'organization:delete',
      'organization:suspend', 'organization:reactivate', 'user:create', 'user:read', 'user:update', 'user:delete',
      'user:suspend', 'user:invite', 'user:password-reset', 'user:force-logout', 'user:assign-role',
      'role:create', 'role:read', 'role:update', 'role:delete', 'role:assign',
      'api-key:create', 'api-key:read', 'api-key:update', 'api-key:delete', 'api-key:rotate',
      'feature-flag:create', 'feature-flag:read', 'feature-flag:update', 'feature-flag:delete',
      'configuration:read', 'configuration:update', 'channel:read', 'channel:update', 'channel:connect', 'channel:disconnect',
      'webhook:create', 'webhook:read', 'webhook:update', 'webhook:delete', 'webhook:test',
      'audit:read', 'backup:create', 'backup:read', 'backup:restore', 'maintenance:read', 'maintenance:update', 'health:read',
    ]})
  })

  // ── API Keys ─────────────────────────────────────────────────────
  router.get('/api-keys', auth, requirePerm('api-key:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().apiKeys.list(ctx(req).tenantId, Number(req.query.page) || 1, Number(req.query.limit) || 20) }) }
    catch (err) { next(err) }
  })

  router.post('/api-keys', auth, requirePerm('api-key:create'), async (req: Request, res: Response, next: NextFunction) => {
    try { const result = await admin().apiKeys.create(req.body, ctx(req).tenantId, ctx(req).userId, clientIp(req)); res.status(201).json({ success: true, data: result }) }
    catch (err) { next(err) }
  })

  router.post('/api-keys/:id/rotate', auth, requirePerm('api-key:rotate'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().apiKeys.rotate(param(req, 'id'), ctx(req).tenantId, ctx(req).userId, clientIp(req)) }) }
    catch (err) { next(err) }
  })

  router.delete('/api-keys/:id', auth, requirePerm('api-key:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try { await admin().apiKeys.revoke(param(req, 'id'), ctx(req).tenantId, ctx(req).userId, clientIp(req)); res.json({ success: true, message: 'API key revoked' }) }
    catch (err) { next(err) }
  })

  // ── Channels ─────────────────────────────────────────────────────
  router.get('/channels', auth, requirePerm('channel:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().channels.list(ctx(req).tenantId) }) }
    catch (err) { next(err) }
  })

  router.get('/channels/:type', auth, requirePerm('channel:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().channels.getByType(ctx(req).tenantId, param(req, 'type')) }) }
    catch (err) { next(err) }
  })

  // ── Feature Flags ────────────────────────────────────────────────
  router.get('/feature-flags', auth, requirePerm('feature-flag:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().featureFlags.list(ctx(req).tenantId) }) }
    catch (err) { next(err) }
  })

  router.post('/feature-flags', auth, requirePerm('feature-flag:create'), async (req: Request, res: Response, next: NextFunction) => {
    try { const flag = await admin().featureFlags.create(req.body, ctx(req).userId, clientIp(req)); res.status(201).json({ success: true, data: flag }) }
    catch (err) { next(err) }
  })

  router.patch('/feature-flags/:id', auth, requirePerm('feature-flag:update'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().featureFlags.update(param(req, 'id'), req.body, ctx(req).userId, ctx(req).tenantId, clientIp(req)) }) }
    catch (err) { next(err) }
  })

  router.delete('/feature-flags/:id', auth, requirePerm('feature-flag:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try { await admin().featureFlags.delete(param(req, 'id'), ctx(req).userId, ctx(req).tenantId, clientIp(req)); res.json({ success: true, message: 'Feature flag deleted' }) }
    catch (err) { next(err) }
  })

  // ── Configuration ────────────────────────────────────────────────
  router.get('/configuration', auth, requirePerm('configuration:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const svc = admin().configuration
      const config = await svc.list(ctx(req).tenantId, req.query.category as string | undefined)
      const defaults = await svc.getDefaults()
      res.json({ success: true, data: { config, defaults } })
    } catch (err) { next(err) }
  })

  router.get('/configuration/:key', auth, requirePerm('configuration:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().configuration.get(ctx(req).tenantId, param(req, 'key')) }) }
    catch (err) { next(err) }
  })

  router.patch('/configuration', auth, requirePerm('configuration:update'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().configuration.set(ctx(req).tenantId, req.body.key, req.body.value, req.body.category ?? 'general', ctx(req).userId, clientIp(req)) }) }
    catch (err) { next(err) }
  })

  // ── Webhooks ─────────────────────────────────────────────────────
  router.get('/webhooks', auth, requirePerm('webhook:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().webhooks.list(ctx(req).tenantId, Number(req.query.page) || 1, Number(req.query.limit) || 20) }) }
    catch (err) { next(err) }
  })

  router.post('/webhooks', auth, requirePerm('webhook:create'), async (req: Request, res: Response, next: NextFunction) => {
    try { const wh = await admin().webhooks.create(req.body, ctx(req).tenantId, ctx(req).userId, clientIp(req)); res.status(201).json({ success: true, data: wh }) }
    catch (err) { next(err) }
  })

  router.patch('/webhooks/:id', auth, requirePerm('webhook:update'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().webhooks.update(param(req, 'id'), req.body, ctx(req).tenantId, ctx(req).userId, clientIp(req)) }) }
    catch (err) { next(err) }
  })

  router.delete('/webhooks/:id', auth, requirePerm('webhook:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try { await admin().webhooks.delete(param(req, 'id'), ctx(req).tenantId, ctx(req).userId, clientIp(req)); res.json({ success: true, message: 'Webhook deleted' }) }
    catch (err) { next(err) }
  })

  router.post('/webhooks/:id/test', auth, requirePerm('webhook:test'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().webhooks.test(param(req, 'id'), ctx(req).tenantId) }) }
    catch (err) { next(err) }
  })

  router.post('/webhooks/:id/rotate-secret', auth, requirePerm('webhook:update'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().webhooks.rotateSecret(param(req, 'id'), ctx(req).tenantId, ctx(req).userId, clientIp(req)) }) }
    catch (err) { next(err) }
  })

  // ── Audit ────────────────────────────────────────────────────────
  router.get('/audit', auth, requirePerm('audit:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as Record<string, string | undefined>
      res.json({ success: true, data: await admin().audit.query({
        tenantId: ctx(req).tenantId, userId: q.userId, action: q.action, entity: q.entity, entityId: q.entityId,
        startDate: q.startDate, endDate: q.endDate, page: Number(q.page) || 1, limit: Number(q.limit) || 50,
      })})
    } catch (err) { next(err) }
  })

  // ── Backups ──────────────────────────────────────────────────────
  router.get('/backups', auth, requirePerm('backup:read'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().backups.list(Number(req.query.page) || 1, Number(req.query.limit) || 20) }) }
    catch (err) { next(err) }
  })

  router.post('/backups', auth, requirePerm('backup:create'), async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().backups.create(req.body.type ?? 'configuration', ctx(req).userId, ctx(req).tenantId, clientIp(req)) }) }
    catch (err) { next(err) }
  })

  router.get('/backups/validate', auth, requirePerm('backup:read'), async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().backups.validate() }) }
    catch (err) { next(err) }
  })

  // ── Maintenance ──────────────────────────────────────────────────
  router.get('/maintenance', auth, requirePerm('maintenance:read'), async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await admin().maintenance.getStatus() }) }
    catch (err) { next(err) }
  })

  router.post('/maintenance/enable', auth, requirePerm('maintenance:update'), async (req: Request, res: Response, next: NextFunction) => {
    try { const { message, scheduledStart, scheduledEnd, allowlist } = req.body; await admin().maintenance.enable(message, ctx(req).userId, ctx(req).tenantId, scheduledStart, scheduledEnd, allowlist, clientIp(req)); res.json({ success: true, message: 'Maintenance mode enabled' }) }
    catch (err) { next(err) }
  })

  router.post('/maintenance/disable', auth, requirePerm('maintenance:update'), async (req: Request, res: Response, next: NextFunction) => {
    try { await admin().maintenance.disable(ctx(req).userId, ctx(req).tenantId, clientIp(req)); res.json({ success: true, message: 'Maintenance mode disabled' }) }
    catch (err) { next(err) }
  })

  return router
}
