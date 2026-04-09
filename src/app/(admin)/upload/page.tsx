'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface PreviewRow {
  ship_number: string
  owner_name: string
}

interface ImportResult {
  imported: number
  skipped_errors: string[]
}

export default function UploadPage() {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null)
  const [csvText, setCsvText] = useState<string>('')
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

    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = (e.target?.result as string) || ''
      setCsvText(text)

      // Client-side preview parse
      const res = await fetch('/api/ships', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: text,
      })
      // We just want to peek — actually call a preview endpoint isn't available,
      // so we parse locally with a quick split
      const lines = text
        .trim()
        .split('\n')
        .slice(1)
        .map((l) => l.split(',').map((c) => c.trim()))
        .filter((c) => c.length >= 2)
      const rows: PreviewRow[] = lines.map(([ship_number, owner_name]) => ({
        ship_number,
        owner_name,
      }))
      setPreview(rows.slice(0, 20))
      setParseErrors(rows.length === 0 ? ['No valid rows found in CSV'] : [])
      if (res.ok) {
        const json = await res.json()
        setResult(json.data)
      } else {
        const json = await res.json()
        setApiError(json.error ?? 'Import failed')
      }
    }
    reader.readAsText(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  })

  async function handleImport() {
    if (!csvText) return
    setLoading(true)
    setApiError('')
    setResult(null)

    const res = await fetch('/api/ships', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: csvText,
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setApiError(json.error ?? 'Import failed')
      return
    }
    setResult(json.data)
    setPreview(null)
    setCsvText('')
    setFileName('')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">นำเข้าข้อมูล CSV</h1>
      <p className="text-gray-700 mb-6 text-sm">
        รูปแบบ CSV: <code className="bg-gray-100 text-gray-800 px-1 rounded">ship_number,owner_name</code>{' '}
        (ต้องมีแถว header). รองรับ header ภาษาไทย{' '}
        <code className="bg-gray-100 text-gray-800 px-1 rounded">หมายเลขเรือ,ชื่อเจ้าของ</code> ด้วย
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
          <p className="text-blue-600 font-medium">วางไฟล์ CSV ที่นี่…</p>
        ) : (
          <>
            <p className="font-medium text-gray-800">ลากและวางไฟล์ CSV หรือคลิกเพื่อเลือกไฟล์</p>
            <p className="text-sm text-gray-600 mt-1">รองรับไฟล์ .csv</p>
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
                  <th className="px-4 py-2 text-left font-semibold">หมายเลขเรือ</th>
                  <th className="px-4 py-2 text-left font-semibold">ชื่อเจ้าของ</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono font-semibold text-gray-900">{row.ship_number}</td>
                    <td className="px-4 py-2 text-gray-900">{row.owner_name}</td>
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
