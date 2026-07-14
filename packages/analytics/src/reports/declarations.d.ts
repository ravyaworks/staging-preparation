declare module 'json2csv' {
  export class Parser {
    constructor(options?: { fields?: string[]; delimiter?: string; header?: boolean })
    parse(data: Record<string, unknown>[]): string
  }
}

declare module 'pdfkit' {
  interface PDFDocumentOptions {
    size?: string | [number, number]
    margins?: { top: number; bottom: number; left: number; right: number }
    margin?: number
    bufferPages?: boolean
    info?: Record<string, string>
    autoFirstPage?: boolean
  }

  class PDFDocument {
    constructor(options?: PDFDocumentOptions)
    page: {
      width: number
      height: number
      margins: { top: number; bottom: number; left: number; right: number }
    }
    x: number
    y: number
    font(name: string): this
    fontSize(size: number): this
    text(text: string, x?: number, y?: number, options?: { width?: number; align?: string }): this
    moveTo(x: number, y: number): this
    lineTo(x: number, y: number): this
    stroke(): this
    strokeColor(color: string): this
    addPage(options?: PDFDocumentOptions): this
    end(): void
    on(event: string, callback: (...args: never[]) => void): this
    bufferPage(): void
  }

  export default PDFDocument
}
