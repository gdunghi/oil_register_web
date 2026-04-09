import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseCsvText } from '@/lib/csv-parser'

// GET /api/ships — list all ships (admin only, handled by middleware)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const filter = searchParams.get('q') ?? ''

  let query = supabaseAdmin
    .from('ships')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filter) {
    query = query.or(`ship_number.ilike.%${filter}%,owner_name.ilike.%${filter}%`)
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count, page, limit })
}

// POST /api/ships — bulk import from CSV text body
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? ''
  let csvText: string

  if (contentType.includes('application/json')) {
    const body = await request.json()
    csvText = body.csv as string
  } else {
    csvText = await request.text()
  }

  const { rows, errors } = parseCsvText(csvText)

  if (!rows.length) {
    return NextResponse.json({ error: 'No valid rows found', details: errors }, { status: 400 })
  }

  // Upsert by ship_number
  const { data, error } = await supabaseAdmin
    .from('ships')
    .upsert(
      rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })),
      { onConflict: 'ship_number' }
    )
    .select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: { imported: data?.length ?? rows.length, skipped_errors: errors },
  })
}
