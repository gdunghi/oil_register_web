import { cookies } from 'next/headers'
import { verifyJWT, COOKIE_NAME } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const payload = token ? await verifyJWT(token) : null

  const [{ count: shipCount }, { count: userCount }] = await Promise.all([
    supabaseAdmin.from('ships').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('staff_users').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'เรือทั้งหมด', value: shipCount ?? 0, color: 'bg-blue-100 text-blue-700' },
    { label: 'เจ้าหน้าที่', value: userCount ?? 0, color: 'bg-green-100 text-green-700' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">หน้าหลัก</h1>
      <p className="text-gray-600 mb-8">ยินดีต้อนรับ, {payload?.username}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl p-6 ${s.color}`}>
            <p className="text-3xl font-bold">{s.value.toLocaleString()}</p>
            <p className="text-sm mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/upload', label: 'อับโหลดข้อมูลเรือ', icon: '📤', desc: 'อับโหลดข้อมูลเรือไฟล์ CSV,EXCEL' },
          { href: '/ships', label: 'จัดการข้อมูลเรือ', icon: '🚢', desc: 'ดูและลบรายการข้อมูลเรือ' },
          { href: '/users', label: 'จัดการผู้ใช้', icon: '👥', desc: 'สร้างและจัดการบัญชีเจ้าหน้าที่' },
        ].map((card) => (
          <a
            key={card.href}
            href={card.href}
            className="block bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition p-6"
          >
            <p className="text-3xl mb-2">{card.icon}</p>
            <p className="font-semibold text-gray-900">{card.label}</p>
            <p className="text-sm text-gray-600 mt-1">{card.desc}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
