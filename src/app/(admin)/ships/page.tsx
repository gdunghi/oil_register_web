'use client'

import { useEffect, useState, useCallback } from 'react'
import type { Ship } from '@/types'

type Tab = 'ships' | 'import-log' | 'delete-log'

interface ImportLog {
  id: string
  imported_at: string
  imported_by: string
  record_count: number
  skipped_count: number
  data_date: string | null
  file_name: string | null
}

interface DeleteLog {
  id: string
  deleted_at: string
  deleted_by: string
  ship_number: string
  ship_name: string
  ship_name_association: string
  status: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ShipsPage() {
  const [tab, setTab] = useState<Tab>('ships')

  // ── Delete confirm modal ─────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Ship | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    await fetch(`/api/ships/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteTarget(null)
    fetchShips()
  }

  // ── Ships tab state ──────────────────────────────────────────────────────
  const [ships, setShips] = useState<Ship[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const limit = 10

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

  useEffect(() => { if (tab === 'ships') fetchShips() }, [fetchShips, tab])

  function fmt(n: number | null) {
    if (n == null) return '—'
    return n.toLocaleString('th-TH')
  }

  // ── Import log tab state ─────────────────────────────────────────────────
  const [importLogs, setImportLogs] = useState<ImportLog[]>([])
  const [importLoading, setImportLoading] = useState(false)

  const fetchImportLog = useCallback(async () => {
    setImportLoading(true)
    const res = await fetch('/api/ships/import-log')
    const json = await res.json()
    setImportLogs(json.data ?? [])
    setImportLoading(false)
  }, [])

  useEffect(() => { if (tab === 'import-log') fetchImportLog() }, [fetchImportLog, tab])

  // ── Delete log tab state ─────────────────────────────────────────────────
  const [deleteLogs, setDeleteLogs] = useState<DeleteLog[]>([])
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchDeleteLog = useCallback(async () => {
    setDeleteLoading(true)
    const res = await fetch('/api/ships/delete-log')
    const json = await res.json()
    setDeleteLogs(json.data ?? [])
    setDeleteLoading(false)
  }, [])

  useEffect(() => { if (tab === 'delete-log') fetchDeleteLog() }, [fetchDeleteLog, tab])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'ships', label: 'ข้อมูลเรือ' },
    { key: 'import-log', label: 'ประวัติ Upload' },
    { key: 'delete-log', label: 'ประวัติการลบ' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-5">ข้อมูลเรือ</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              tab === t.key
                ? 'bg-white border border-b-white border-gray-200 text-blue-600 -mb-px'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Ships tab ──────────────────────────────────────────────────────── */}
      {tab === 'ships' && (
        <>
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              placeholder="ค้นหาทะเบียนเรือหรือชื่อเรือ…"
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
            <a
              href="/api/ships/export"
              download
              className="flex items-center gap-1 text-sm border border-gray-400 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
            >
              ⬇ Export ข้อมูล
            </a>
          </div>

          <p className="text-sm text-gray-600 mb-3">พบ {total.toLocaleString()} รายการ</p>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ทะเบียนเรือ</th>
                  <th className="px-4 py-3 text-left font-semibold">รหัสน้ำมันเขียว</th>
                  <th className="px-4 py-3 text-left font-semibold">ชื่อเรือ (สรรพสามิต)</th>
                  <th className="px-4 py-3 text-left font-semibold">ชื่อเรือ (สมาคม)</th>
                  <th className="px-4 py-3 text-right font-semibold">ความจุถัง</th>
                  <th className="px-4 py-3 text-right font-semibold">ปริมาณใช้งาน</th>
                  <th className="px-4 py-3 text-center font-semibold">สถานะ</th>
                  <th className="px-4 py-3 text-right font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">กำลังโหลด…</td></tr>
                ) : ships.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">ไม่พบข้อมูลเรือ</td></tr>
                ) : (
                  ships.map((ship) => (
                    <tr key={ship.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-semibold text-gray-900">{ship.ship_number}</td>
                      <td className="px-4 py-3 text-gray-700">{ship.green_oil_code || '—'}</td>
                      <td className="px-4 py-3 text-gray-900">{ship.ship_name}</td>
                      <td className="px-4 py-3 text-gray-900">{ship.ship_name_association}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmt(ship.tank_capacity)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{fmt(ship.usage_volume)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          ship.status === 'ลงได้' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {ship.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteTarget(ship)}
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

          {total > limit && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded border border-gray-400 text-gray-700 disabled:opacity-40"
              >
                ← ก่อนหน้า
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                หน้า {page} / {Math.ceil(total / limit)}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= total}
                className="px-3 py-1 text-sm rounded border border-gray-400 text-gray-700 disabled:opacity-40"
              >
                ถัดไป →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Import log tab ─────────────────────────────────────────────────── */}
      {tab === 'import-log' && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">วันที่ Upload</th>
                <th className="px-4 py-3 text-left font-semibold">ข้อมูล ณ วันที่</th>
                <th className="px-4 py-3 text-left font-semibold">ชื่อไฟล์</th>
                <th className="px-4 py-3 text-left font-semibold">ผู้ Upload</th>
                <th className="px-4 py-3 text-right font-semibold">จำนวน Record</th>
                <th className="px-4 py-3 text-right font-semibold">ข้ามแถว (error)</th>
              </tr>
            </thead>
            <tbody>
              {importLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">กำลังโหลด…</td></tr>
              ) : importLogs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">ยังไม่มีประวัติการ Upload</td></tr>
              ) : (
                importLogs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{fmtDate(log.imported_at)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {log.data_date
                        ? new Date(log.data_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-[180px] truncate" title={log.file_name ?? ''}>
                      {log.file_name ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.imported_by}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      {log.record_count.toLocaleString('th-TH')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.skipped_count > 0
                        ? <span className="text-orange-600 font-medium">{log.skipped_count}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Delete log tab ─────────────────────────────────────────────────── */}
      {tab === 'delete-log' && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">วันที่ / เวลา</th>
                <th className="px-4 py-3 text-left font-semibold">ผู้ลบ</th>
                <th className="px-4 py-3 text-left font-semibold">ทะเบียนเรือ</th>
                <th className="px-4 py-3 text-left font-semibold">ชื่อเรือ (สรรพสามิต)</th>
                <th className="px-4 py-3 text-left font-semibold">ชื่อเรือ (สมาคม)</th>
                <th className="px-4 py-3 text-center font-semibold">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {deleteLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">กำลังโหลด…</td></tr>
              ) : deleteLogs.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">ยังไม่มีประวัติการลบ</td></tr>
              ) : (
                deleteLogs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{fmtDate(log.deleted_at)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.deleted_by}</td>
                    <td className="px-4 py-3 font-mono text-gray-900">{log.ship_number}</td>
                    <td className="px-4 py-3 text-gray-900">{log.ship_name}</td>
                    <td className="px-4 py-3 text-gray-700">{log.ship_name_association || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        log.status === 'ลงได้' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Delete confirm modal ──────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">ยืนยันการลบ</h2>
            <p className="text-sm text-gray-600 mb-4">ต้องการลบเรือรายการนี้ออกจากระบบ?</p>
            <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6 space-y-1">
              <p className="text-xs text-gray-500">ทะเบียนเรือ</p>
              <p className="font-mono font-semibold text-gray-900">{deleteTarget.ship_number}</p>
              <p className="text-xs text-gray-500 mt-2">ชื่อเรือ</p>
              <p className="text-gray-900">{deleteTarget.ship_name}</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 font-medium"
              >
                {deleting ? 'กำลังลบ…' : 'ลบรายการ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
