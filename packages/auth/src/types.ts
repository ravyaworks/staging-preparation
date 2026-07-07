export interface TokenPayload {
  sub: string;
  tenantId: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface PasswordValidation {
  isValid: boolean;
  message?: string;
}

export interface SessionInfo {
  id: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}
