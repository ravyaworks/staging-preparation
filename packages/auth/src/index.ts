export { createJwtHandler } from './jwt';
export type { JwtConfig } from './jwt';

export { hashPassword, comparePassword, validatePassword, generateVerificationToken } from './password';

export { authenticate, optionalAuth, requireRole, extractTenantId } from './middleware';

export type { TokenPayload, TokenPair, AuthContext, PasswordValidation, SessionInfo } from './types';
