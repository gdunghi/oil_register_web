import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseCsvText, parseExcelBuffer } from '@/lib/csv-parser'

// GET /api/ships — list all ships (admin only, handled by middleware)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '10'))
  const from = (page - 1) * limit
  const to = from + limit - 1

  const filter = searchParams.get('q') ?? ''

  let query = supabaseAdmin
    .from('ships')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filter) {
    query = query.or(`ship_number.ilike.${filter}%,ship_name.ilike.${filter}%`)
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count, page, limit })
}

// POST /api/ships — bulk import from CSV or Excel
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? ''
  let rows
  let errors: string[] = []

  if (
    contentType.includes('application/vnd.openxmlformats') ||
    contentType.includes('application/vnd.ms-excel') ||
    contentType.includes('application/octet-stream')
  ) {
    // Excel binary
    const buffer = await request.arrayBuffer()
    const result = await parseExcelBuffer(buffer)
    rows = result.rows
    errors = result.errors
  } else if (contentType.includes('application/json')) {
    const body = await request.json()
    const result = parseCsvText(body.csv as string)
    rows = result.rows
    errors = result.errors
  } else {
    // CSV text
    const csvText = await request.text()
    const result = parseCsvText(csvText)
    rows = result.rows
    errors = result.errors
  }

  if (!rows.length) {
    return NextResponse.json({ error: 'ไม่พบข้อมูลที่ถูกต้อง', details: errors }, { status: 400 })
  }

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
