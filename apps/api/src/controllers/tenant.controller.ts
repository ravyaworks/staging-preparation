import type { Request, Response, NextFunction } from 'express';
import type { Prisma } from '@prisma/client';
import { getPrismaClient, TenantRepository } from '@conversation-platform/database';
import { NotFoundError } from '@conversation-platform/shared';
import { createTenantSchema, updateTenantSchema } from '../validators';

interface TenantService {
  list(): Promise<unknown>;
  getById(id: string): Promise<unknown>;
  create(params: { name: string; slug: string; domain?: string }): Promise<unknown>;
  update(id: string, params: { name?: string; domain?: string; settings?: Record<string, unknown> }): Promise<unknown>;
  deactivate(id: string): Promise<unknown>;
}

function createTenantService(): TenantService {
  async function list() {
    const prisma = getPrismaClient();
    const repo = new TenantRepository(prisma);
    return repo.findMany();
  }

  async function getById(id: string) {
    const prisma = getPrismaClient();
    const repo = new TenantRepository(prisma);
    const tenant = await repo.findById(id);
    if (!tenant) {
      throw new NotFoundError('Tenant', id);
    }
    return tenant;
  }

  async function create(params: { name: string; slug: string; domain?: string }) {
    const prisma = getPrismaClient();
    const repo = new TenantRepository(prisma);
    return repo.create(params);
  }

  async function update(id: string, params: { name?: string; domain?: string; settings?: Record<string, unknown> }) {
    const prisma = getPrismaClient();
    const repo = new TenantRepository(prisma);
    const tenant = await repo.findById(id);
    if (!tenant) {
      throw new NotFoundError('Tenant', id);
    }
    const data: Prisma.TenantUpdateInput = {};
    if (params.name !== undefined) { data.name = params.name; }
    if (params.domain !== undefined) { data.domain = params.domain; }
    if (params.settings !== undefined) { data.settings = params.settings as Prisma.InputJsonValue; }
    return repo.update(id, data);
  }

  async function deactivate(id: string) {
    const prisma = getPrismaClient();
    const repo = new TenantRepository(prisma);
    const tenant = await repo.findById(id);
    if (!tenant) {
      throw new NotFoundError('Tenant', id);
    }
    return repo.update(id, { isActive: false });
  }

  return { list, getById, create, update, deactivate };
}

export function createTenantController() {
  const service = createTenantService();

  return {
    async list(req: Request, res: Response, next: NextFunction) {
      try {
        const tenants = await service.list();
        res.json({ success: true, data: tenants, meta: { timestamp: new Date().toISOString() } });
      } catch (error) {
        next(error);
      }
    },

    async getById(req: Request, res: Response, next: NextFunction) {
      try {
        const tenant = await service.getById(req.params.id as string);
        res.json({ success: true, data: tenant, meta: { timestamp: new Date().toISOString() } });
      } catch (error) {
        next(error);
      }
    },

    async create(req: Request, res: Response, next: NextFunction) {
      try {
        const parsed = createTenantSchema.parse(req.body);
        const tenant = await service.create(parsed);
        res.status(201).json({ success: true, data: tenant, meta: { timestamp: new Date().toISOString() } });
      } catch (error) {
        next(error);
      }
    },

    async update(req: Request, res: Response, next: NextFunction) {
      try {
        const parsed = updateTenantSchema.parse(req.body);
        const tenant = await service.update(req.params.id as string, parsed);
        res.json({ success: true, data: tenant, meta: { timestamp: new Date().toISOString() } });
      } catch (error) {
        next(error);
      }
    },

    async deactivate(req: Request, res: Response, next: NextFunction) {
      try {
        const tenant = await service.deactivate(req.params.id as string);
        res.json({ success: true, data: tenant, meta: { timestamp: new Date().toISOString() } });
      } catch (error) {
        next(error);
      }
    },
  };
}
