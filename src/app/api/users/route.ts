import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/users — list staff users (admin only)
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('staff_users')
    .select('id, username, role, is_active, created_at, created_by')
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 }) }
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
    return NextResponse.json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 })
  }

  if (!['admin', 'staff'].includes(role)) {
    return NextResponse.json({ error: 'role ต้องเป็น admin หรือ staff เท่านั้น' }, { status: 400 })
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
      return NextResponse.json({ error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' }, { status: 409 })
    }
    console.error(error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
