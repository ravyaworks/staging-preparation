// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDefined();
  });

  it('renders with variant class', () => {
    render(<Button variant="primary">Primary</Button>);
    const btn = screen.getByText('Primary');
    expect(btn.className).toContain('bg-blue');
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByText('Loading')).toBeDefined();
  });

  it('applies disabled attribute when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByText('Disabled') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('applies disabled attribute when loading', () => {
    render(<Button isLoading>Loading</Button>);
    const btn = screen.getByText('Loading') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('renders with custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const btn = screen.getByText('Custom');
    expect(btn.className).toContain('custom-class');
  });

  it('forwards ref', () => {
    const ref = { current: null };
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
