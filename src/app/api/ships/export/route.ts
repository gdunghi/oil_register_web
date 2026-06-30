import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const PAGE_SIZE = 1000
  let page = 0
  const allShips: Record<string, unknown>[] = []

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('ships')
      .select('id, ship_number, green_oil_code, ship_name, ship_name_association, tank_capacity, usage_volume, status, created_at, updated_at')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      .order('ship_number')

    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    allShips.push(...data)
    if (data.length < PAGE_SIZE) break
    page++
  }

  const { data: versionData, error: vErr } = await supabaseAdmin
    .from('ships_data_version')
    .select('last_modified_at')
    .single()

  if (vErr) console.error(vErr)

  const payload = {
    ships: allShips,
    data_version: versionData?.last_modified_at ?? null,
    synced_at: new Date().toISOString(),
  }

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const fileName = `ships_${today}.json`

  return new NextResponse(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
