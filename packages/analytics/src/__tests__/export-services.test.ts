import { describe, it, expect } from 'vitest'
import { CsvExportService } from '../reports/csv.export'
import { XlsxExportService } from '../reports/xlsx.export'

describe('CsvExportService', () => {
  const service = new CsvExportService()

  it('exports data to CSV buffer', async () => {
    const data = [
      { name: 'Campaign A', status: 'completed', channel: 'whatsapp' },
      { name: 'Campaign B', status: 'running', channel: 'email' },
    ]
    const buffer = await service.export(data, ['name', 'status', 'channel'])
    const content = buffer.toString('utf-8')
    expect(content).toContain('"name","status","channel"')
    expect(content).toContain('"Campaign A"')
  })

  it('handles empty data', async () => {
    const buffer = await service.export([], ['col1', 'col2'])
    const content = buffer.toString('utf-8')
    expect(content).toContain('"col1","col2"')
  })

  it('only exports specified columns', async () => {
    const data = [{ name: 'A', status: 'ok', extra: 'hidden' }]
    const buffer = await service.export(data, ['name'])
    const content = buffer.toString('utf-8')
    expect(content).toContain('name')
    expect(content).not.toContain('extra')
    expect(content).not.toContain('status')
  })
})

describe('XlsxExportService', () => {
  const service = new XlsxExportService()

  it('exports data to XLSX buffer', async () => {
    const data = [
      { name: 'Campaign A', status: 'completed' },
      { name: 'Campaign B', status: 'running' },
    ]
    const buffer = await service.export(data, ['name', 'status'], 'Campaigns', 'Campaign Report')
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('handles empty data', async () => {
    const buffer = await service.export([], ['col1'], 'Sheet1')
    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)
  })
})
