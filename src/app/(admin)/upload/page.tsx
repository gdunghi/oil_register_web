'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface PreviewRow {
  ship_number: string
  green_oil_code: string
  ship_name: string
  tank_capacity: string
  usage_volume: string
  status: string
}

interface ImportResult {
  imported: number
  skipped_errors: string[]
}

export default function UploadPage() {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [fileData, setFileData] = useState<{ content: string | ArrayBuffer; isExcel: boolean } | null>(null)
  const [fileName, setFileName] = useState('')
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [apiError, setApiError] = useState('')

  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    setApiError('')
    setPreview(null)
    setParseErrors([])

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    if (isExcel) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const buffer = e.target?.result as ArrayBuffer
        setFileData({ content: buffer, isExcel: true })
        // Preview via dynamic import
        const { parseExcelBuffer } = await import('@/lib/csv-parser')
        const { rows, errors } = await parseExcelBuffer(buffer)
        setPreview(rows.slice(0, 20).map((r) => ({
          ship_number: r.ship_number,
          green_oil_code: r.green_oil_code,
          ship_name: r.ship_name,
          tank_capacity: r.tank_capacity?.toLocaleString('th-TH') ?? '',
          usage_volume: r.usage_volume?.toLocaleString('th-TH') ?? '',
          status: r.status,
        })))
        setParseErrors(errors)
      }
      reader.readAsArrayBuffer(file)
    } else {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = (e.target?.result as string) || ''
        setFileData({ content: text, isExcel: false })
        const { parseCsvText } = await import('@/lib/csv-parser')
        const { rows, errors } = parseCsvText(text)
        setPreview(rows.slice(0, 20).map((r) => ({
          ship_number: r.ship_number,
          green_oil_code: r.green_oil_code,
          ship_name: r.ship_name,
          tank_capacity: r.tank_capacity?.toLocaleString('th-TH') ?? '',
          usage_volume: r.usage_volume?.toLocaleString('th-TH') ?? '',
          status: r.status,
        })))
        setParseErrors(errors)
      }
      reader.readAsText(file, 'utf-8')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  })

  async function handleImport() {
    if (!fileData) return
    setLoading(true)
    setApiError('')
    setResult(null)

    let res: Response
    if (fileData.isExcel) {
      res = await fetch('/api/ships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        body: fileData.content as ArrayBuffer,
      })
    } else {
      res = await fetch('/api/ships', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: fileData.content as string,
      })
    }

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setApiError(json.error ?? 'นำเข้าไม่สำเร็จ')
      return
    }
    setResult(json.data)
    setPreview(null)
    setFileData(null)
    setFileName('')
  }

  async function downloadTemplate(type: 'csv' | 'excel') {
    if (type === 'csv') {
      const header = 'ทะเบียนเรือ,รหัสน้ำมันเขียว,ชื่อเรือจากสรรพสามิต,ความจุถัง,ปริมาณการใช้งาน,สถานะ\n'
      const sample = '288103842,กบ-01-0005,ศ.ศักดิ์สังวาลย์เพชร 3,4500,12000,ลงได้\n'
      const blob = new Blob(['\uFEFF' + header + sample], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'ship_template.csv'; a.click()
      URL.revokeObjectURL(url)
    } else {
      const { utils, writeFile } = await import('xlsx')
      const wb = utils.book_new()
      const ws = utils.aoa_to_sheet([
        ['ทะเบียนเรือ', 'รหัสน้ำมันเขียว', 'ชื่อเรือจากสรรพสามิต', 'ความจุถัง', 'ปริมาณการใช้งาน', 'สถานะ'],
        ['288103842', 'กบ-01-0005', 'ศ.ศักดิ์สังวาลย์เพชร 3', 4500, 12000, 'ลงได้'],
        ['585202640', 'กบ-01-0006', 'ศ.ศักดิ์สังวาลย์เพชร 7', 2500, 4000, 'ลงได้'],
      ])
      utils.book_append_sheet(wb, ws, 'เรือ')
      writeFile(wb, 'ship_template.xlsx')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-800">นำเข้าข้อมูล CSV / Excel</h1>
        <div className="flex gap-2">
          <button
            onClick={() => downloadTemplate('excel')}
            className="flex items-center gap-1 text-sm border border-green-500 text-green-700 hover:bg-green-50 px-3 py-2 rounded-lg transition"
          >
            ⬇ แม่แบบ Excel
          </button>
          <button
            onClick={() => downloadTemplate('csv')}
            className="flex items-center gap-1 text-sm border border-gray-400 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg transition"
          >
            ⬇ แม่แบบ CSV
          </button>
        </div>
      </div>
      <p className="text-gray-700 mb-6 text-sm">
        รองรับไฟล์ <strong>.xlsx</strong> และ <strong>.csv</strong> — คอลัมน์:{' '}
        <code className="bg-gray-100 text-gray-800 px-1 rounded text-xs">
          ทะเบียนเรือ, รหัสน้ำมันเขียว, ชื่อเรือจากสรรพสามิต, ความจุถัง, ปริมาณการใช้งาน, สถานะ
        </code>
      </p>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-4xl mb-3">📤</p>
        {isDragActive ? (
          <p className="text-blue-600 font-medium">วางไฟล์ที่นี่…</p>
        ) : (
          <>
            <p className="font-medium text-gray-800">ลากและวางไฟล์ หรือคลิกเพื่อเลือกไฟล์</p>
            <p className="text-sm text-gray-600 mt-1">รองรับ .xlsx และ .csv</p>
          </>
        )}
      </div>

      {/* Parse errors */}
      {parseErrors.length > 0 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-semibold text-red-700 mb-1">พบข้อผิดพลาดในการอ่านไฟล์</p>
          {parseErrors.map((e, i) => (
            <p key={i} className="text-sm text-red-600">{e}</p>
          ))}
        </div>
      )}

      {/* Preview table */}
      {preview && preview.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold text-gray-800 mb-2">
            ตัวอย่างข้อมูล — {fileName} (แสดง {preview.length} แถวแรก)
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">ทะเบียนเรือ</th>
                  <th className="px-3 py-2 text-left font-semibold">รหัสน้ำมันเขียว</th>
                  <th className="px-3 py-2 text-left font-semibold">ชื่อเรือ</th>
                  <th className="px-3 py-2 text-right font-semibold">ความจุถัง</th>
                  <th className="px-3 py-2 text-right font-semibold">ปริมาณใช้งาน</th>
                  <th className="px-3 py-2 text-center font-semibold">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono font-semibold text-gray-900">{row.ship_number}</td>
                    <td className="px-3 py-2 text-gray-700">{row.green_oil_code || '—'}</td>
                    <td className="px-3 py-2 text-gray-900">{row.ship_name}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{row.tank_capacity || '—'}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{row.usage_volume || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        row.status === 'ลงได้' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                      }`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={loading}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-60"
          >
            {loading ? 'กำลังนำเข้า…' : 'ยืนยันการนำเข้า'}
          </button>
        </div>
      )}

      {/* API error */}
      {apiError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {apiError}
        </div>
      )}

      {/* Success result */}
      {result && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="font-semibold text-green-700">✅ นำเข้าข้อมูลสำเร็จ</p>
          <p className="text-sm text-green-600 mt-1">
            นำเข้าสำเร็จ {result.imported} รายการ
          </p>
          {result.skipped_errors.length > 0 && (
            <details className="mt-2">
              <summary className="text-sm text-yellow-700 cursor-pointer">
                {result.skipped_errors.length} รายการมีข้อผิดพลาด
              </summary>
              <ul className="mt-1 text-xs text-yellow-700 list-disc list-inside">
                {result.skipped_errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
