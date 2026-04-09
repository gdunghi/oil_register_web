'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Ship } from '@/types'

export default function ShipsPage() {
  const [ships, setShips] = useState<Ship[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const limit = 50

  const fetchShips = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (query) params.set('q', query)
    const res = await fetch(`/api/ships?${params}`)
    const json = await res.json()
    setShips(json.data ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [page, query])

  useEffect(() => { fetchShips() }, [fetchShips])

  async function handleDelete(id: string) {
    if (!confirm('ยืนยันการลบรายการเรือนี้?')) return
    await fetch(`/api/ships/${id}`, { method: 'DELETE' })
    fetchShips()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">ข้อมูลเรือ</h1>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="ค้นหาหมายเลขเรือหรือชื่อเจ้าของ…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setQuery(search); setPage(1) } }}
          className="flex-1 border border-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 placeholder:text-gray-500"
        />
        <button
          onClick={() => { setQuery(search); setPage(1) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
        >
          ค้นหา
        </button>
        {query && (
          <button
            onClick={() => { setSearch(''); setQuery(''); setPage(1) }}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            ล้างการค้นหา
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3">พบ {total.toLocaleString()} รายการ</p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-800">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">หมายเลขเรือ</th>
              <th className="px-4 py-3 text-left font-semibold">ชื่อเจ้าของ</th>
              <th className="px-4 py-3 text-left font-semibold">วันที่เพิ่ม</th>
              <th className="px-4 py-3 text-right font-semibold">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">กำลังโหลด…</td>
              </tr>
            ) : ships.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">ไม่พบข้อมูลเรือ</td>
              </tr>
            ) : (
              ships.map((ship) => (
                <tr key={ship.id} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-900">{ship.ship_number}</td>
                  <td className="px-4 py-3 text-gray-900">{ship.owner_name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {new Date(ship.created_at).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(ship.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm rounded border border-gray-400 text-gray-700 disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-700">
            หน้า {page} / {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * limit >= total}
            className="px-3 py-1 text-sm rounded border border-gray-400 text-gray-700 disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
