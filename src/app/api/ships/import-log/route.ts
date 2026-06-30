import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('ship_import_log')
    .select('*')
    .order('imported_at', { ascending: false })
    .limit(50)

  if (error) { console.error(error); return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' }, { status: 500 }) }
  return NextResponse.json({ data })
}
