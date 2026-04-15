import { SignJWT, jwtVerify } from 'jose'
import { createHash, randomBytes } from 'crypto'
import type { JWTPayload } from '@/types'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresIn = '8h',
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret)
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

/** Generates a cryptographically secure 32-byte random token (hex string). */
export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex')
}

/** SHA-256 hex digest — stored in DB; the raw token is never persisted. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export const COOKIE_NAME = 'oil_auth_token'
