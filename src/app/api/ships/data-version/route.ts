import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('ships_data_version')
    .select('last_modified_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'ไม่สามารถอ่านเวอร์ชันข้อมูลได้' }, { status: 500 })
  }
  return NextResponse.json({ last_modified_at: data.last_modified_at })
}
