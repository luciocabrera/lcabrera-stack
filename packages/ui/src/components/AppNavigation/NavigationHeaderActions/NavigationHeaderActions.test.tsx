// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { NavigationHeaderActions } from './NavigationHeaderActions.component';

afterEach(cleanup);

const baseProps = {
  controlButtonSize: 'sm' as const,
  controlIconSize: 16,
  controlTooltipPlacement: undefined,
  isCollapsed: false,
  isExpanded: true,
  onToggleExpanded: vi.fn(),
};

describe('NavigationHeaderActions', () => {
  it('renders the collapse button when expanded', () => {
    render(<NavigationHeaderActions {...baseProps} />);

    expect(
      screen.getByRole('button', { name: /Collapse navigation/i }),
    ).toBeDefined();
  });

  it('renders the expand button when collapsed', () => {
    render(
      <NavigationHeaderActions
        {...baseProps}
        isCollapsed={true}
        isExpanded={false}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Expand navigation/i }),
    ).toBeDefined();
  });

  it('renders no pin or close control', () => {
    render(<NavigationHeaderActions {...baseProps} />);

    expect(
      screen.queryByRole('button', { name: /pin navigation/i }),
    ).toBeNull();
    expect(
      screen.queryByRole('button', { name: /Close navigation/i }),
    ).toBeNull();
  });

  it('calls onToggleExpanded when the expand/collapse button is clicked', () => {
    const onToggleExpanded = vi.fn();
    render(
      <NavigationHeaderActions
        {...baseProps}
        onToggleExpanded={onToggleExpanded}
      />,
    );

    screen.getByRole('button', { name: /Collapse navigation/i }).click();

    expect(onToggleExpanded).toHaveBeenCalledTimes(1);
  });
});
