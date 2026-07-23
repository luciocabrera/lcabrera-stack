// @vitest-environment jsdom

import type {
  NavLinkRenderProps,
  NavLinkProps as RouterNavLinkProps,
} from 'react-router';

import * as stylex from '@stylexjs/stylex';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const { mockRouterNavLink } = vi.hoisted(() => {
  const mockRenderProps: NavLinkRenderProps = {
    isActive: false,
    isPending: false,
    isTransitioning: false,
  };

  const mockRouterNavLink = ({
    'aria-disabled': ariaDisabled,
    children,
    className,
  }: RouterNavLinkProps) => {
    const resolvedClassName =
      typeof className === 'function'
        ? className(mockRenderProps)
        : (className ?? '');
    const resolvedChildren =
      typeof children === 'function' ? children(mockRenderProps) : children;

    return (
      <a aria-disabled={ariaDisabled} className={resolvedClassName} href='/'>
        {resolvedChildren}
      </a>
    );
  };

  return { mockRouterNavLink };
});

vi.mock('react-router', () => ({
  NavLink: mockRouterNavLink,
}));

import { NavLink } from './NavLink.component';
import { linkItemStyles } from './NavLink.stylex';

afterEach(cleanup);

const busyWaveClass = stylex
  .props(linkItemStyles.busyWave)
  .className?.split(' ', 1)[0];

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

  it('renders the busy shimmer overlay and disables the link when isBusy is true', () => {
    const { container } = render(
      <NavLink isBusy to='/home'>
        Home
      </NavLink>,
    );

    expect(container.querySelector(`.${busyWaveClass}`)).not.toBeNull();
    expect(
      screen.getByRole('link', { name: 'Home' }).getAttribute('aria-disabled'),
    ).toBe('true');
  });

  it('omits the busy overlay and aria-disabled when not busy', () => {
    const { container } = render(<NavLink to='/home'>Home</NavLink>);

    expect(container.querySelector(`.${busyWaveClass}`)).toBeNull();
    expect(
      screen.getByRole('link', { name: 'Home' }).getAttribute('aria-disabled'),
    ).toBeNull();
  });
});
