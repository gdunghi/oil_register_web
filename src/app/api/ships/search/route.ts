import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/ships/search?q=SHIP_NUMBER — accessible by staff and admin
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q) {
    return NextResponse.json({ error: 'query parameter q is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('ships')
    .select('id, ship_number, owner_name, created_at, updated_at')
    .ilike('ship_number', q)
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data || data.length === 0) {
    return NextResponse.json({ data: null, found: false })
  }

  return NextResponse.json({ data: data[0], found: true })
}
