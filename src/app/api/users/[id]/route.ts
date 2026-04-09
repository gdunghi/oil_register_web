import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

// PUT /api/users/[id] — update username, password, role, or is_active
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { username, password, role, is_active } = body as {
    username?: string
    password?: string
    role?: string
    is_active?: boolean
  }

  const updates: Record<string, unknown> = {}
  if (username) updates.username = username.trim()
  if (role && ['admin', 'staff'].includes(role)) updates.role = role
  if (typeof is_active === 'boolean') updates.is_active = is_active
  if (password) updates.password_hash = await bcrypt.hash(password, 12)

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('staff_users')
    .update(updates)
    .eq('id', id)
    .select('id, username, role, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/users/[id] — deactivate (soft delete)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { error } = await supabaseAdmin
    .from('staff_users')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { success: true } })
}
