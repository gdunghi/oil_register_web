import Papa from 'papaparse'

export interface ShipRow {
  ship_number: string       // ทะเบียนเรือ
  green_oil_code: string    // รหัสน้ำมันเขียว
  ship_name: string         // ชื่อเรือจากสรรพสามิต
  tank_capacity: number | null   // ความจุถัง
  usage_volume: number | null    // ปริมาณการใช้งาน
  status: string            // สถานะ
}

export interface ParseResult {
  rows: ShipRow[]
  errors: string[]
}

/** Normalise a raw record (from CSV or Excel) into a ShipRow */
function normaliseRow(raw: Record<string, string | number | null | undefined>, index: number, errors: string[]): ShipRow | null {
  // Normalize all keys: trim whitespace so " ความจุถัง " matches "ความจุถัง"
  const r: Record<string, string | number | null | undefined> = {}
  for (const [k, v] of Object.entries(raw)) {
    r[k.trim()] = v
  }

  const get = (...keys: string[]) => {
    for (const k of keys) {
      const val = r[k]
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val).trim()
      }
    }
    return ''
  }

  const ship_number = get('ship_number', 'ทะเบียนเรือ')
  const ship_name   = get('ship_name', 'ชื่อเรือจากสรรพสามิต', 'ชื่อเรือ')

  if (!ship_number) {
    errors.push(`แถว ${index + 2}: ไม่พบทะเบียนเรือ`)
    return null
  }
  if (!ship_name) {
    errors.push(`แถว ${index + 2}: ไม่พบชื่อเรือ`)
    return null
  }

  const parseNum = (keys: string[]) => {
    const s = get(...keys).replace(/,/g, '')
    const n = parseFloat(s)
    return isNaN(n) ? null : n
  }

  return {
    ship_number,
    green_oil_code: get('green_oil_code', 'รหัสน้ำมันเขียว'),
    ship_name,
    tank_capacity: parseNum(['tank_capacity', 'ความจุถัง']),
    usage_volume:  parseNum(['usage_volume', 'ปริมาณการใช้งาน']),
    status: get('status', 'สถานะ') || 'ลงได้',
  }
}

/** Parse CSV text */
export function parseCsvText(csvText: string): ParseResult {
  const errors: string[] = []
  const rows: ShipRow[] = []

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  if (result.errors.length) {
    errors.push(...result.errors.map((e) => `แถว ${e.row}: ${e.message}`))
  }

  for (let i = 0; i < result.data.length; i++) {
    const row = normaliseRow(result.data[i] as Record<string, string>, i, errors)
    if (row) rows.push(row)
  }

  return { rows, errors }
}

/** Parse Excel ArrayBuffer (xlsx) */
export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ParseResult> {
  const { read, utils } = await import('xlsx')
  const errors: string[] = []
  const rows: ShipRow[] = []

  const wb = read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = utils.sheet_to_json<Record<string, string | number>>(ws, { defval: '' })

  for (let i = 0; i < raw.length; i++) {
    const row = normaliseRow(raw[i] as Record<string, string | number | null | undefined>, i, errors)
    if (row) rows.push(row)
  }

  return { rows, errors }
}
