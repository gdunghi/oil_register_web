import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/ships/sync — paginated full export for mobile offline sync
// Accessible by staff and admin (carve-out in proxy.ts)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') ?? '500')))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await supabaseAdmin
    .from('ships')
    .select(
      'id, ship_number, green_oil_code, ship_name, tank_capacity, usage_volume, status, created_at, updated_at',
      { count: 'exact' }
    )
    .order('ship_number', { ascending: true })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const total = count ?? 0
  return NextResponse.json({
    data,
    total,
    page,
    limit,
    has_more: page * limit < total,
  })
}
