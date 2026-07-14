import { Parser } from 'json2csv'

export class CsvExportService {
  async export(data: Record<string, unknown>[], columns: string[]): Promise<Buffer> {
    const processedData = data.map((row) => {
      const filtered: Record<string, unknown> = {}
      for (const col of columns) {
        const value = row[col]
        if (value !== null && value !== undefined && typeof value === 'object' && !(value instanceof Date)) {
          filtered[col] = JSON.stringify(value)
        } else if (value instanceof Date) {
          filtered[col] = value.toISOString()
        } else {
          filtered[col] = value ?? ''
        }
      }
      return filtered
    })

    const parser = new Parser({ fields: columns })
    const csv = parser.parse(processedData)
    return Buffer.from(csv, 'utf-8')
  }
}
