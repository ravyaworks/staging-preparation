import ExcelJS from 'exceljs'

export class XlsxExportService {
  async export(
    data: Record<string, unknown>[],
    columns: string[],
    sheetName?: string,
    title?: string,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName ?? 'Sheet1')

    let startRow = 1

    if (title) {
      worksheet.mergeCells(startRow, 1, startRow, columns.length)
      const titleCell = worksheet.getCell(startRow, 1)
      titleCell.value = title
      titleCell.font = { bold: true, size: 14 }
      titleCell.alignment = { horizontal: 'center' }
      startRow += 2
    }

    const headerRow = worksheet.getRow(startRow)
    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1)
      cell.value = col
      cell.font = { bold: true }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      }
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.alignment = { horizontal: 'center' }
    })
    startRow++

    for (const row of data) {
      const excelRow = worksheet.getRow(startRow)
      columns.forEach((col, idx) => {
        const cell = excelRow.getCell(idx + 1)
        const value = row[col]
        if (value instanceof Date) {
          cell.value = value.toISOString()
        } else if (value !== null && value !== undefined && typeof value === 'object') {
          cell.value = JSON.stringify(value)
        } else {
          cell.value = String(value ?? '')
        }
      })
      startRow++
    }

    worksheet.columns?.forEach((col) => {
      if (!col || !('eachCell' in col)) return
      let maxLen = 10
      ;(col as ExcelJS.Column).eachCell({ includeEmpty: false }, (cell) => {
        const cellLen = cell.value ? String(cell.value).length : 0
        if (cellLen > maxLen) maxLen = cellLen
      })
      col.width = maxLen + 2
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return Buffer.from(buffer)
  }
}
