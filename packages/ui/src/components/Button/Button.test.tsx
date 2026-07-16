// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { MockTooltip } = vi.hoisted(() => ({
  MockTooltip: vi.fn(
    ({
      children,
    }: {
      readonly children: ReactNode;
      readonly content?: ReactNode;
      readonly placement?: string;
    }) => <div data-testid='tooltip'>{children}</div>,
  ),
}));

vi.mock('../Tooltip', () => ({
  Tooltip: MockTooltip,
}));

import { Button } from './Button.component';

afterEach(() => {
  cleanup();
  MockTooltip.mockClear();
});

describe('Button', () => {
  it('renders a button with the provided children', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByTestId('button').textContent).toContain('Click me');
  });

  it('calls onClick when the button is clicked', () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Clickable</Button>);

    fireEvent.click(screen.getByTestId('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not wrap the button in a Tooltip when tooltipContent is absent', () => {
    render(<Button>No tooltip</Button>);

    expect(screen.queryByTestId('tooltip')).toBeNull();
    expect(MockTooltip).not.toHaveBeenCalled();
  });

  it('wraps the button in a Tooltip when tooltipContent is provided', () => {
    render(<Button tooltipContent='Helpful tip'>Hover me</Button>);

    expect(screen.getByTestId('tooltip')).not.toBeNull();
    expect(screen.getByTestId('button')).not.toBeNull();
    expect(MockTooltip.mock.calls[0]?.[0]?.content).toBe('Helpful tip');
  });

  it('defaults the tooltip placement to "top"', () => {
    render(<Button tooltipContent='Helpful tip'>Hover me</Button>);

    expect(MockTooltip.mock.calls[0]?.[0]?.placement).toBe('top');
  });

  it('passes a custom tooltipPlacement through to the Tooltip', () => {
    render(
      <Button tooltipContent='Helpful tip' tooltipPlacement='right'>
        Hover me
      </Button>,
    );

    expect(MockTooltip.mock.calls[0]?.[0]?.placement).toBe('right');
  });
});
