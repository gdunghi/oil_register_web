import { NextResponse } from 'next/server'

export async function GET() {
  const version = process.env.APP_VERSION
  const downloadUrl = process.env.APK_DOWNLOAD_URL

  if (!version || !downloadUrl) {
    return NextResponse.json({ error: 'ยังไม่ได้ตั้งค่าเวอร์ชัน' }, { status: 503 })
  }

  return NextResponse.json({
    version,
    download_url: downloadUrl,
    release_notes: process.env.APP_RELEASE_NOTES ?? '',
    force_update: process.env.APP_FORCE_UPDATE === 'true',
  })
}
