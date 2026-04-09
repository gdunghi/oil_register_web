import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/users — list staff users (admin only)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('staff_users')
    .select('id, username, role, is_active, created_at, created_by')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/users — create staff user (admin only)
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const { username, password, role = 'staff' } = body as {
    username?: string
    password?: string
    role?: string
  }

  if (!username || !password) {
    return NextResponse.json({ error: 'username and password required' }, { status: 400 })
  }

  if (!['admin', 'staff'].includes(role)) {
    return NextResponse.json({ error: 'role must be admin or staff' }, { status: 400 })
  }

  const adminId = request.headers.get('x-user-id')
  const password_hash = await bcrypt.hash(password, 12)

  const { data, error } = await supabaseAdmin
    .from('staff_users')
    .insert({ username: username.trim(), password_hash, role, created_by: adminId })
    .select('id, username, role, is_active, created_at')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
