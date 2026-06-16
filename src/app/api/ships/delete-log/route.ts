import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('ship_delete_log')
    .select('id, deleted_at, deleted_by, ship_number, ship_name, ship_name_association, status')
    .order('deleted_at', { ascending: false })
    .limit(100)

  if (error) { console.error(error); return NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
  return NextResponse.json({ data })
}
