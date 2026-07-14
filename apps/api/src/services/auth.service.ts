import { getPrismaClient, UserRepository, TenantRepository, SessionRepository, AuditLogRepository } from '@conversation-platform/database';
import { createJwtHandler, hashPassword, comparePassword, validatePassword } from '@conversation-platform/auth';
import { ValidationError, UnauthorizedError, ConflictError } from '@conversation-platform/shared';
import type { AppConfig } from '@conversation-platform/config';
import type { Logger } from '@conversation-platform/logger';
import { v4 as uuid } from 'uuid';

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 900;
  }
  const value = parseInt(match[1] as string, 10);
  const unit = match[2] as string;
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return value;
  }
}

export function createAuthService(config: AppConfig, logger: Logger) {
  const jwt = createJwtHandler({
    secret: config.auth.jwtSecret,
    expiresIn: parseDuration(config.auth.jwtExpiresIn),
    refreshSecret: config.auth.refreshSecret,
    refreshExpiresIn: parseDuration(config.auth.refreshExpiresIn),
    issuer: config.auth.issuer,
  });

  async function register(params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    tenantName: string;
    tenantSlug: string;
  }) {
    const prisma = getPrismaClient();
    const userRepo = new UserRepository(prisma);
    const tenantRepo = new TenantRepository(prisma);

    const existingUser = await userRepo.findByEmail(params.email);
    if (existingUser) {
      throw new ConflictError('A user with this email already exists');
    }

    const existingTenant = await tenantRepo.findBySlug(params.tenantSlug);
    if (existingTenant) {
      throw new ConflictError('A tenant with this slug already exists');
    }

    const passwordValidation = validatePassword(params.password);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.message ?? 'Invalid password');
    }

    const passwordHash = await hashPassword(params.password);

    const tenant = await tenantRepo.create({
      name: params.tenantName,
      slug: params.tenantSlug,
    });

    const user = await userRepo.create({
      email: params.email,
      passwordHash,
      firstName: params.firstName,
      lastName: params.lastName,
      tenant: { connect: { id: tenant.id } },
    });

    await createAuditLog({
      tenantId: tenant.id,
      userId: user.id,
      action: 'create',
      entity: 'user',
      entityId: user.id,
    });

    const tokenPair = jwt.generateTokenPair({
      sub: user.id,
      tenantId: tenant.id,
      email: user.email,
      role: 'admin',
    });

    const session = await createSession(user.id, tokenPair.refreshToken);

    logger.info({ userId: user.id, tenantId: tenant.id }, 'User registered');

    return {
      user: sanitizeUser(user),
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      ...tokenPair,
      sessionId: session.id,
    };
  }

  async function login(params: { email: string; password: string }) {
    const prisma = getPrismaClient();
    const userRepo = new UserRepository(prisma);

    const user = await userRepo.findByEmail(params.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    const valid = await comparePassword(params.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await userRepo.updateLastLogin(user.id);

    const tokenPair = jwt.generateTokenPair({
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: 'user',
    });

    const session = await createSession(user.id, tokenPair.refreshToken);

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'login',
      entity: 'session',
    });

    logger.info({ userId: user.id }, 'User logged in');

    return {
      user: sanitizeUser(user),
      ...tokenPair,
      sessionId: session.id,
    };
  }

  async function refreshTokens(refreshToken: string) {
    const prisma = getPrismaClient();
    const sessionRepo = new SessionRepository(prisma);

    let payload;
    try {
      payload = jwt.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const session = await sessionRepo.findByRefreshToken(refreshToken);
    if (!session || !session.isActive) {
      throw new UnauthorizedError('Session has expired');
    }

    const newTokenPair = jwt.generateTokenPair({
      sub: payload.sub,
      tenantId: payload.tenantId,
      email: payload.email,
      role: payload.role,
    });

    await sessionRepo.deactivate(session.id);

    const newSession = await createSession(payload.sub, newTokenPair.refreshToken);

    return {
      ...newTokenPair,
      sessionId: newSession.id,
    };
  }

  async function logout(sessionId: string) {
    const prisma = getPrismaClient();
    const sessionRepo = new SessionRepository(prisma);
    await sessionRepo.deactivate(sessionId);
  }

  async function logoutAll(userId: string) {
    const prisma = getPrismaClient();
    const sessionRepo = new SessionRepository(prisma);
    await sessionRepo.deactivateAllForUser(userId);
  }

  async function getUserById(userId: string) {
    const prisma = getPrismaClient();
    const userRepo = new UserRepository(prisma);
    const user = await userRepo.findById(userId);
    return user ? sanitizeUser(user) : null;
  }

  async function forgotPassword(email: string) {
    const prisma = getPrismaClient();
    const userRepo = new UserRepository(prisma);
    const { generateVerificationToken } = await import('@conversation-platform/auth');

    const user = await userRepo.findByEmail(email);
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExp: expiresAt },
    });

    logger.info({ userId: user.id }, 'Password reset token generated');
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async function resetPassword(token: string, newPassword: string) {
    const prisma = getPrismaClient();

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExp: { gte: new Date() } },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.message ?? 'Invalid password');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExp: null },
    });

    logger.info({ userId: user.id }, 'Password reset completed');
    return { message: 'Password has been reset successfully' };
  }

  async function changePassword(userId: string, currentPassword: string, newPassword: string) {
    const prisma = getPrismaClient();
    const userRepo = new UserRepository(prisma);

    const user = await userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) {
      throw new ValidationError('Current password is incorrect');
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.message ?? 'Invalid password');
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    logger.info({ userId }, 'Password changed');
    return { message: 'Password changed successfully' };
  }

  return {
    register,
    login,
    refreshTokens,
    logout,
    logoutAll,
    getUserById,
    forgotPassword,
    resetPassword,
    changePassword,
  };
}

async function createSession(userId: string, refreshToken: string) {
  const prisma = getPrismaClient();
  const sessionRepo = new SessionRepository(prisma);

  return sessionRepo.create({
    token: uuid(),
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    user: { connect: { id: userId } },
  });
}

async function createAuditLog(params: {
  tenantId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
}) {
  const prisma = getPrismaClient();
  const auditLogRepo = new AuditLogRepository(prisma);

  return auditLogRepo.create({
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    tenant: { connect: { id: params.tenantId } },
    user: params.userId ? { connect: { id: params.userId } } : undefined,
  });
}

function sanitizeUser(user: { id: string; email: string; firstName: string; lastName: string; isActive: boolean; isVerified: boolean; createdAt: Date; tenantId: string; [key: string]: unknown }) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    isVerified: user.isVerified,
    tenantId: user.tenantId,
    createdAt: user.createdAt,
  };
}
