import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// DELETE /api/ships/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: ship } = await supabaseAdmin
    .from('ships')
    .select('*')
    .eq('id', id)
    .single()

  const { error } = await supabaseAdmin.from('ships').delete().eq('id', id)
  if (error) { console.error(error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }

  if (ship) {
    await supabaseAdmin.from('ship_delete_log').insert({
      deleted_by: request.headers.get('x-username') ?? 'unknown',
      ship_id: ship.id,
      ship_number: ship.ship_number,
      green_oil_code: ship.green_oil_code,
      ship_name: ship.ship_name,
      ship_name_association: ship.ship_name_association,
      tank_capacity: ship.tank_capacity,
      usage_volume: ship.usage_volume,
      status: ship.status,
      ship_created_at: ship.created_at,
      ship_updated_at: ship.updated_at,
    })
  }

  return NextResponse.json({ data: { success: true } })
}
