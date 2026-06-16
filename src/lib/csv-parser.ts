import Papa from 'papaparse'

export interface ShipRow {
  ship_number: string            // col 0
  green_oil_code: string         // col 1
  ship_name: string              // col 2
  ship_name_association: string  // col 3
  tank_capacity: number | null   // col 4
  usage_volume: number | null    // col 5
  status: string                 // col 6
}

export interface ParseResult {
  rows: ShipRow[]
  errors: string[]
}

type RawRow = (string | number | null | undefined)[]

function normaliseRow(raw: RawRow, index: number, errors: string[]): ShipRow | null {
  const str = (i: number) => {
    const v = raw[i]
    if (v === undefined || v === null) return ''
    return String(v).trim()
  }

  const parseNum = (i: number) => {
    const s = str(i).replace(/,/g, '')
    const n = parseFloat(s)
    return isNaN(n) ? null : n
  }

  const ship_number = str(0)
  const ship_name = str(2)
  const ship_name_association = str(3)

  if (!ship_number) {
    errors.push(`แถว ${index + 2}: ไม่พบทะเบียนเรือ`)
    return null
  }
  if (!ship_name) {
    errors.push(`แถว ${index + 2}: ไม่พบชื่อเรือ`)
    return null
  }
  return {
    ship_number,
    green_oil_code: str(1),
    ship_name,
    ship_name_association,
    tank_capacity: parseNum(4),
    usage_volume: parseNum(5),
    status: str(6) || 'ลงได้',
  }
}

/** Parse CSV text — first row is header and is skipped */
export function parseCsvText(csvText: string): ParseResult {
  const errors: string[] = []
  const rows: ShipRow[] = []

  const result = Papa.parse<RawRow>(csvText, {
    header: false,
    skipEmptyLines: true,
  })

  if (result.errors.length) {
    errors.push(...result.errors.map((e) => `แถว ${e.row}: ${e.message}`))
  }

  // skip row 0 (header)
  for (let i = 1; i < result.data.length; i++) {
    const row = normaliseRow(result.data[i], i - 1, errors)
    if (row) rows.push(row)
  }

  return { rows, errors }
}

/** Parse Excel ArrayBuffer — first row is header and is skipped */
export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ParseResult> {
  const { read, utils } = await import('xlsx')
  const errors: string[] = []
  const rows: ShipRow[] = []

  const wb = read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const raw = utils.sheet_to_json<RawRow>(ws, { header: 1, defval: '' })

  // skip row 0 (header)
  for (let i = 1; i < raw.length; i++) {
    const row = normaliseRow(raw[i], i - 1, errors)
    if (row) rows.push(row)
  }

  return { rows, errors }
}
