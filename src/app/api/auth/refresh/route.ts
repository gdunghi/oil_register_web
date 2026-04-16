import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { signJWT, generateRefreshToken, hashToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { refresh_token } = body as { refresh_token?: string }

  if (!refresh_token) {
    return NextResponse.json({ error: 'refresh_token required' }, { status: 400 })
  }

  const hash = hashToken(refresh_token)

  const { data: row } = await supabaseAdmin
    .from('refresh_tokens')
    .select('id, user_id, expires_at, revoked_at')
    .eq('token_hash', hash)
    .single()

  if (!row || row.revoked_at || new Date(row.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'Session expired — please log in again' },
      { status: 401 },
    )
  }

  const { data: user } = await supabaseAdmin
    .from('staff_users')
    .select('id, username, role, is_active')
    .eq('id', row.user_id)
    .single()

  if (!user || !user.is_active) {
    return NextResponse.json(
      { error: 'Session expired — please log in again' },
      { status: 401 },
    )
  }

  // Token rotation: revoke old token, issue new one.
  const newRefreshToken = generateRefreshToken()
  const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  await supabaseAdmin
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', row.id)

  await supabaseAdmin.from('refresh_tokens').insert({
    user_id: user.id,
    token_hash: hashToken(newRefreshToken),
    expires_at: newExpiresAt.toISOString(),
  })

  const newAccessToken = await signJWT({ sub: user.id, username: user.username, role: user.role })

  const response = NextResponse.json({
    token: newAccessToken,
    refresh_token: newRefreshToken,
  })
  response.cookies.set(COOKIE_NAME, newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  })
  return response
}
