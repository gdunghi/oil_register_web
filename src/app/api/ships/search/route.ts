import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/ships/search?q=... — accessible by staff and admin
// Returns up to 20 ships whose ship_number OR ship_name starts with q (case-insensitive)
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json({ error: 'query parameter q is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('ships')
    .select('id, ship_number, green_oil_code, ship_name, tank_capacity, usage_volume, status, created_at, updated_at')
    .or(`ship_number.ilike.${q}%,ship_name.ilike.${q}%`)
    .order('ship_number', { ascending: true })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 })
}
