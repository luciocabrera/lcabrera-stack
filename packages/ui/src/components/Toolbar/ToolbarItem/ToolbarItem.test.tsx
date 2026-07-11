// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ToolbarItem } from './ToolbarItem.component';

afterEach(() => {
  cleanup();
});

type MockButtonProps = {
  readonly 'aria-label'?: string;
  readonly children?: ReactNode;
  readonly isIconOnly?: boolean;
  readonly onClick?: () => void;
};

type MockNavLinkProps = {
  readonly children?: ReactNode;
  readonly to?: string;
};

const MockButton = vi.hoisted(() => {
  return function MockButton({
    'aria-label': ariaLabel,
    children,
    isIconOnly,
    onClick,
  }: MockButtonProps) {
    return (
      <button
        aria-label={ariaLabel}
        data-icon-only={isIconOnly}
        onClick={onClick}
        type='button'
      >
        {children}
      </button>
    );
  };
});

const MockNavLink = vi.hoisted(() => {
  return function MockNavLink({ children, to }: MockNavLinkProps) {
    return <a href={to}>{children}</a>;
  };
});

vi.mock('@repo/ui/components/Button', () => ({
  Button: MockButton,
}));

vi.mock('@repo/ui/components/NavLink', () => ({
  NavLink: MockNavLink,
}));

describe('ToolbarItem', () => {
  it('renders a button entry inside a list item and forwards clicks', () => {
    const onClick = vi.fn();

    render(
      <ToolbarItem
        isCompact={false}
        item={{ label: 'Refresh', onClick, type: 'button' }}
        orientation='vertical'
        size='md'
      />,
    );

    const button = screen.getByRole('button', { name: 'Refresh' });
    expect(button.closest('li')).not.toBeNull();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a link entry pointing at its target', () => {
    render(
      <ToolbarItem
        isCompact={false}
        item={{ label: 'Home', to: '/home', type: 'link' }}
        orientation='vertical'
        size='md'
      />,
    );

    expect(screen.getByText('Home').getAttribute('href')).toBe('/home');
  });

  it('switches the control to icon-only with an aria-label when compact', () => {
    render(
      <ToolbarItem
        isCompact
        item={{ label: 'Refresh', onClick: () => void 0, type: 'button' }}
        orientation='vertical'
        size='md'
      />,
    );

    const button = screen.getByRole('button', { name: 'Refresh' });
    expect(button.getAttribute('aria-label')).toBe('Refresh');
    expect(button.getAttribute('data-icon-only')).toBe('true');
  });
});
