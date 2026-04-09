import Papa from 'papaparse'

export interface CsvRow {
  ship_number: string
  owner_name: string
}

export interface ParseResult {
  rows: CsvRow[]
  errors: string[]
}

export function parseCsvText(csvText: string): ParseResult {
  const errors: string[] = []
  const rows: CsvRow[] = []

  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
  })

  if (result.errors.length) {
    errors.push(...result.errors.map((e) => `Row ${e.row}: ${e.message}`))
  }

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i]
    const ship_number = (row['ship_number'] || row['หมายเลขเรือ'] || '').trim()
    const owner_name = (row['owner_name'] || row['ชื่อเจ้าของ'] || '').trim()

    if (!ship_number) {
      errors.push(`Row ${i + 2}: missing ship_number`)
      continue
    }
    if (!owner_name) {
      errors.push(`Row ${i + 2}: missing owner_name`)
      continue
    }

    rows.push({ ship_number, owner_name })
  }

  return { rows, errors }
}
