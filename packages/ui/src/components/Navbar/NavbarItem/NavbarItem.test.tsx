// @vitest-environment jsdom
import type { ReactNode } from 'react';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { NavbarItem } from './NavbarItem.component';

afterEach(() => {
  cleanup();
});

type MockButtonProps = {
  readonly 'aria-label'?: string;
  readonly children?: ReactNode;
  readonly isDisabled?: boolean;
  readonly isIconOnly?: boolean;
  readonly onClick?: () => void;
};

type MockNavLinkProps = {
  readonly children?: ReactNode;
  readonly to?: string;
};

const MockButton = vi.hoisted(() => {
  // Mirrors the real Button, which renders disabled={isDisabled || isBusy}.
  // A stub that drops them silently makes disabled-state assertions vacuous.
  return function MockButton({
    'aria-label': ariaLabel,
    children,
    isDisabled,
    isIconOnly,
    onClick,
  }: MockButtonProps) {
    return (
      <button
        aria-label={ariaLabel}
        data-icon-only={isIconOnly}
        disabled={isDisabled}
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

vi.mock('#ui/components/Button', () => ({
  Button: MockButton,
}));

vi.mock('#ui/components/NavLink', () => ({
  NavLink: MockNavLink,
}));

describe('NavbarItem', () => {
  it('renders a button entry inside a list item and forwards clicks', () => {
    const onClick = vi.fn();

    render(
      <NavbarItem
        isCompact={false}
        item={{ label: 'Refresh', onClick, type: 'button' }}
        orientation='vertical'
        size='md'
      />,
    );

    const button = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Refresh',
    });
    expect(button.closest('li')).not.toBeNull();
    expect(button.disabled).toBe(false);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables a button entry marked isDisabled, so its click never fires', () => {
    const onClick = vi.fn();

    render(
      <NavbarItem
        isCompact={false}
        item={{ isDisabled: true, label: 'Refresh', onClick, type: 'button' }}
        orientation='vertical'
        size='md'
      />,
    );

    const button = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Refresh',
    });
    expect(button.disabled).toBe(true);

    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a link entry pointing at its target', () => {
    render(
      <NavbarItem
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
      <NavbarItem
        isCompact
        item={{ label: 'Refresh', onClick: () => void 0, type: 'button' }}
        orientation='vertical'
        size='md'
      />,
    );

    const button = screen.getByRole('button', { name: 'Refresh' });
    expect(button.getAttribute('aria-label')).toBe('Refresh');
    expect(button.dataset.iconOnly).toBe('true');
  });
});
