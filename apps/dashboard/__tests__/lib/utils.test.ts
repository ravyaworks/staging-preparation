import { describe, it, expect } from 'vitest'
import { cn, formatDate, formatBytes, truncate, pluralize, generateId } from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', 'visible')
    expect(result).toBe('base visible')
  })

  it('handles undefined values', () => {
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
  })
})

describe('formatDate', () => {
  it('formats a Date object', () => {
    const date = new Date('2024-01-15T14:30:00')
    const result = formatDate(date)
    expect(result).toContain('Jan')
    expect(result).toContain('15')
    expect(result).toContain('2024')
  })

  it('formats an ISO string', () => {
    const result = formatDate('2024-06-20T09:00:00')
    expect(result).toContain('Jun')
    expect(result).toContain('20')
    expect(result).toContain('2024')
  })
})

describe('formatBytes', () => {
  it('returns 0 B for 0', () => {
    expect(formatBytes(0)).toBe('0 B')
  })

  it('formats bytes', () => {
    expect(formatBytes(500)).toBe('500 B')
  })

  it('formats KB', () => {
    expect(formatBytes(2048)).toBe('2 KB')
  })

  it('formats MB', () => {
    expect(formatBytes(1048576)).toBe('1 MB')
  })

  it('formats GB', () => {
    expect(formatBytes(1073741824)).toBe('1 GB')
  })
})

describe('truncate', () => {
  it('returns short strings as-is', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('returns exact length strings as-is', () => {
    expect(truncate('12345', 5)).toBe('12345')
  })

  it('truncates longer strings with ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello...')
  })
})

describe('pluralize', () => {
  it('returns singular for count 1', () => {
    expect(pluralize(1, 'item')).toBe('item')
  })

  it('returns plural for other counts', () => {
    expect(pluralize(0, 'item')).toBe('items')
    expect(pluralize(2, 'item')).toBe('items')
    expect(pluralize(100, 'item')).toBe('items')
  })

  it('uses custom plural form', () => {
    expect(pluralize(2, 'child', 'children')).toBe('children')
  })

  it('returns singular with custom plural form', () => {
    expect(pluralize(1, 'child', 'children')).toBe('child')
  })
})

describe('generateId', () => {
  it('returns a string', () => {
    expect(typeof generateId()).toBe('string')
  })

  it('returns non-empty string', () => {
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('returns unique values', () => {
    const ids = Array.from({ length: 1000 }, () => generateId())
    const unique = new Set(ids)
    expect(unique.size).toBe(1000)
  })
})
