// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NavigationHeaderActions } from './NavigationHeaderActions.component';

afterEach(cleanup);

const baseProps = {
  controlButtonSize: 'sm' as const,
  controlIconSize: 16,
  controlTooltipPlacement: undefined,
  isCollapsed: false,
  isExpanded: true,
  isPinned: true,
  onClose: vi.fn(),
  onToggleExpanded: vi.fn(),
  onTogglePinned: vi.fn(),
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

  it('renders the unpin button when pinned', () => {
    render(<NavigationHeaderActions {...baseProps} isPinned={true} />);

    expect(
      screen.getByRole('button', { name: /Unpin navigation/i }),
    ).toBeDefined();
  });

  it('renders the pin button when unpinned', () => {
    render(<NavigationHeaderActions {...baseProps} isPinned={false} />);

    expect(
      screen.getByRole('button', { name: /Pin navigation/i }),
    ).toBeDefined();
  });

  it('renders the close button when unpinned', () => {
    render(<NavigationHeaderActions {...baseProps} isPinned={false} />);

    expect(
      screen.getByRole('button', { name: /Close navigation/i }),
    ).toBeDefined();
  });

  it('hides the close button when pinned', () => {
    render(<NavigationHeaderActions {...baseProps} isPinned={true} />);

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

  it('calls onTogglePinned when the pin button is clicked', () => {
    const onTogglePinned = vi.fn();
    render(
      <NavigationHeaderActions
        {...baseProps}
        onTogglePinned={onTogglePinned}
      />,
    );

    screen.getByRole('button', { name: /Unpin navigation/i }).click();

    expect(onTogglePinned).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <NavigationHeaderActions
        {...baseProps}
        isPinned={false}
        onClose={onClose}
      />,
    );

    screen.getByRole('button', { name: /Close navigation/i }).click();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
