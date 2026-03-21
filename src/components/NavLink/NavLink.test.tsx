// @vitest-environment jsdom

import type { ReactNode } from 'react';
import type { NavLinkProps as RouterNavLinkProps } from 'react-router';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NavLink } from './NavLink.component';

afterEach(() => {
  cleanup();
});

vi.mock('react-router', () => ({
  NavLink: ({ children, className }: RouterNavLinkProps) => {
    const resolvedClassName =
      typeof className === 'function'
        ? className({ isActive: false, isPending: false, isTransitioning: false })
        : (className ?? '');
    return (
      <a className={resolvedClassName} href='#'>
        {children}
      </a>
    );
  },
}));

describe('NavLink', () => {
  it('renders children text', () => {
    render(<NavLink to='/home'>Home</NavLink>);
    expect(screen.getByText('Home').textContent).toBe('Home');
  });

  it('renders icon slot when icon prop is provided', () => {
    render(
      <NavLink icon={<span>icon-element</span>} to='/settings'>
        Settings
      </NavLink>,
    );
    expect(screen.getByText('icon-element').textContent).toBe('icon-element');
    expect(screen.getByText('Settings').textContent).toBe('Settings');
  });
});
