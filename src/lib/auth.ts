import { SignJWT, jwtVerify } from 'jose'
import type { JWTPayload } from '@/types'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
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

export const COOKIE_NAME = 'oil_auth_token'
