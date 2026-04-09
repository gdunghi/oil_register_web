import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyJWT, COOKIE_NAME } from '@/lib/auth'
import AdminNav from '@/components/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const payload = token ? await verifyJWT(token) : null

  if (!payload) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav username={payload.username} role={payload.role} />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
