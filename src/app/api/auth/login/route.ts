import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { signJWT, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { username, password } = body as { username?: string; password?: string }

  if (!username || !password) {
    return NextResponse.json({ error: 'username and password required' }, { status: 400 })
  }

  const { data: user, error } = await supabaseAdmin
    .from('staff_users')
    .select('id, username, password_hash, role, is_active')
    .eq('username', username.trim())
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  if (!user.is_active) {
    return NextResponse.json({ error: 'Account is disabled' }, { status: 403 })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await signJWT({ sub: user.id, username: user.username, role: user.role })

  const response = NextResponse.json({
    data: { id: user.id, username: user.username, role: user.role },
  })
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })

  return response
}
