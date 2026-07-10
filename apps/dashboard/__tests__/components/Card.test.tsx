// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@conversation-platform/ui'

describe('Card', () => {
  it('renders Card with children', () => {
    render(<Card><p>Content</p></Card>)
    expect(screen.getByText('Content')).toBeDefined()
  })

  it('renders CardHeader with children', () => {
    render(<CardHeader><h2>Header</h2></CardHeader>)
    expect(screen.getByText('Header')).toBeDefined()
  })

  it('renders CardTitle as h3', () => {
    render(<CardTitle>Title</CardTitle>)
    const title = screen.getByText('Title')
    expect(title.tagName).toBe('H3')
  })

  it('renders CardDescription as paragraph', () => {
    render(<CardDescription>Description</CardDescription>)
    const desc = screen.getByText('Description')
    expect(desc.tagName).toBe('P')
  })

  it('renders CardContent', () => {
    render(<CardContent><span>Body</span></CardContent>)
    expect(screen.getByText('Body')).toBeDefined()
  })

  it('renders CardFooter', () => {
    render(<CardFooter><button>Action</button></CardFooter>)
    expect(screen.getByText('Action')).toBeDefined()
  })

  it('renders all parts in compound composition', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Main Content</CardContent>
        <CardFooter>Footer Content</CardFooter>
      </Card>
    )
    expect(screen.getByText('Card Title')).toBeDefined()
    expect(screen.getByText('Card Description')).toBeDefined()
    expect(screen.getByText('Main Content')).toBeDefined()
    expect(screen.getByText('Footer Content')).toBeDefined()
  })

  it('renders Card without CardHeader/Footer', () => {
    render(
      <Card>
        <CardContent>Only Content</CardContent>
      </Card>
    )
    expect(screen.getByText('Only Content')).toBeDefined()
  })
})
