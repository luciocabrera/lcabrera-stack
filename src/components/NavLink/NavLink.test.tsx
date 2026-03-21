// @vitest-environment jsdom

import type {
  NavLinkRenderProps,
  NavLinkProps as RouterNavLinkProps,
} from 'react-router';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NavLink } from './NavLink.component';

afterEach(cleanup);

const mockRenderProps: NavLinkRenderProps = {
  isActive: false,
  isPending: false,
  isTransitioning: false,
};

const MockRouterNavLink = ({ children, className }: RouterNavLinkProps) => {
  const resolvedClassName =
    typeof className === 'function'
      ? className(mockRenderProps)
      : (className ?? '');
  const resolvedChildren =
    typeof children === 'function' ? children(mockRenderProps) : children;

  return (
    <a className={resolvedClassName} href='#'>
      {resolvedChildren}
    </a>
  );
};

vi.mock('react-router', () => ({
  NavLink: MockRouterNavLink,
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
