'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { Role } from '@/types'

export default function AdminNav({ username, role }: { username: string; role: Role }) {
  const pathname = usePathname()
  const router = useRouter()

  const links = [
    { href: '/dashboard', label: 'หน้าหลัก' },
    { href: '/upload', label: 'นำเข้าข้อมูล' },
    { href: '/ships', label: 'ข้อมูลเรือ' },
    ...(role === 'admin' ? [{ href: '/users', label: 'จัดการผู้ใช้' }] : []),
  ]

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-blue-700 text-white shadow">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg">⛽ Oil Register</span>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm hover:underline ${pathname.startsWith(l.href) ? 'font-semibold underline' : 'opacity-80'}`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80">{username}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition"
          >
          ออกจากระบบ
          </button>
        </div>
      </div>
    </nav>
  )
}
