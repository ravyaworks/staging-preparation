import PDFDocument from 'pdfkit'

export class PdfExportService {
  async export(
    data: Record<string, unknown>[],
    columns: string[],
    title?: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 40,
        bufferPages: true,
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
      const usableHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom
      const colWidth = pageWidth / columns.length
      const rowHeight = 20
      const headerHeight = 25

      let y = doc.page.margins.top

      if (title) {
        doc.fontSize(16).font('Helvetica-Bold').text(title, doc.page.margins.left, y, {
          align: 'center',
          width: pageWidth,
        })
        y = doc.y + 10
      }

      const drawHeader = () => {
        doc.fontSize(10).font('Helvetica-Bold')
        columns.forEach((col, idx) => {
          const x = doc.page.margins.left + idx * colWidth
          doc.text(col, x + 2, y, { width: colWidth - 4, align: 'left' })
        })
        y += headerHeight
        doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + pageWidth, y).stroke()
        y += 5
        doc.font('Helvetica').fontSize(9)
      }

      drawHeader()

      for (const row of data) {
        if (y + rowHeight > doc.page.margins.top + usableHeight) {
          doc.addPage()
          y = doc.page.margins.top
          drawHeader()
        }

        columns.forEach((col, idx) => {
          const x = doc.page.margins.left + idx * colWidth
          let value = row[col]
          if (value instanceof Date) {
            value = value.toISOString()
          } else if (value !== null && value !== undefined && typeof value === 'object') {
            value = JSON.stringify(value)
          } else if (value === null || value === undefined) {
            value = ''
          }
          doc.text(String(value), x + 2, y, { width: colWidth - 4, align: 'left' })
        })

        y += rowHeight

        doc.moveTo(doc.page.margins.left, y - 3)
          .lineTo(doc.page.margins.left + pageWidth, y - 3)
          .strokeColor('#eeeeee')
          .stroke()
          doc.strokeColor('#000000')
      }

      doc.end()
    })
  }
}
