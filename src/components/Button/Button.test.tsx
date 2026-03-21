// @vitest-environment jsdom

import { type ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { MockTooltip } = vi.hoisted(() => ({
  MockTooltip: vi.fn(({ children }: { readonly children: ReactNode }) => (
    <div data-testid='tooltip'>{children}</div>
  )),
}));

vi.mock('../Tooltip', () => ({
  Tooltip: MockTooltip,
}));

import { Button } from './Button.component';

afterEach(cleanup);

describe('Button', () => {
  it('renders children text inside the button', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByTestId('button').textContent).toContain('Click me');
  });

  it('renders as disabled when isDisabled is true', () => {
    render(<Button isDisabled>Disabled</Button>);

    expect((screen.getByTestId('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders icon slot when icon prop is provided', () => {
    render(<Button icon={<span data-testid='icon'>★</span>}>With Icon</Button>);

    expect(screen.getByTestId('icon')).not.toBeNull();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Clickable</Button>);

    fireEvent.click(screen.getByTestId('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('wraps in Tooltip when tooltipContent is provided', () => {
    render(<Button tooltipContent='Helpful tip'>Hover me</Button>);

    expect(screen.getByTestId('tooltip')).not.toBeNull();
    expect(MockTooltip.mock.calls[0]?.[0]?.content).toBe('Helpful tip');
  });
});
