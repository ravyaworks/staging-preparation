// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@conversation-platform/ui'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDefined()
  })

  it('shows loading state and disables button', () => {
    render(<Button isLoading>Loading</Button>)
    const btn = screen.getByText('Loading') as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  it('shows spinner when loading', () => {
    const { container } = render(<Button isLoading>Click</Button>)
    expect(container.querySelector('svg')).toBeDefined()
  })

  it('fires onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    await userEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('does not fire onClick when loading', async () => {
    const handleClick = vi.fn()
    render(
      <Button isLoading onClick={handleClick}>
        Click
      </Button>
    )
    await userEvent.click(screen.getByText('Click'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('does not fire onClick when disabled', async () => {
    const handleClick = vi.fn()
    render(
      <Button disabled onClick={handleClick}>
        Click
      </Button>
    )
    await userEvent.click(screen.getByText('Click'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('applies primary variant class by default', () => {
    render(<Button>Default</Button>)
    const btn = screen.getByText('Default')
    expect(btn.className).toContain('bg-blue-600')
  })

  it('applies secondary variant class', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByText('Secondary')
    expect(btn.className).toContain('bg-gray-200')
  })

  it('applies outline variant class', () => {
    render(<Button variant="outline">Outline</Button>)
    const btn = screen.getByText('Outline')
    expect(btn.className).toContain('border')
  })

  it('applies ghost variant class', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByText('Ghost')
    expect(btn.className).toContain('bg-transparent')
  })

  it('applies danger variant class', () => {
    render(<Button variant="danger">Danger</Button>)
    const btn = screen.getByText('Danger')
    expect(btn.className).toContain('bg-red-600')
  })
})
