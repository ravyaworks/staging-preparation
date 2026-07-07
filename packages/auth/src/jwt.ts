import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import type { TokenPayload, TokenPair } from './types';

export interface JwtConfig {
  secret: string;
  expiresIn: number;
  refreshSecret: string;
  refreshExpiresIn: number;
  issuer: string;
}

export function createJwtHandler(config: JwtConfig) {
  function signAccessToken(payload: Omit<TokenPayload, 'type'>): string {
    const options: SignOptions = { expiresIn: config.expiresIn, issuer: config.issuer };
    return jwt.sign({ ...payload, type: 'access' }, config.secret, options);
  }

  function signRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
    const options: SignOptions = { expiresIn: config.refreshExpiresIn, issuer: config.issuer };
    return jwt.sign({ ...payload, type: 'refresh' }, config.refreshSecret, options);
  }

  function verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, config.secret) as TokenPayload;
  }

  function verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, config.refreshSecret) as TokenPayload;
  }

  function generateTokenPair(payload: Omit<TokenPayload, 'type'>): TokenPair {
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const expiresIn = config.expiresIn;

    return { accessToken, refreshToken, expiresIn };
  }

  return {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateTokenPair,
  };
}
