// @vitest-environment jsdom

import type { StyleXStyles } from '@stylexjs/stylex';
import type {
  NavLinkRenderProps,
  NavLinkProps as RouterNavLinkProps,
} from 'react-router';

import * as stylex from '@stylexjs/stylex';
import { cleanup, render, screen } from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vite-plus/test';

const { mockRouterNavLink } = vi.hoisted(() => {
  const mockRenderProps: NavLinkRenderProps = {
    isActive: false,
    isPending: false,
    isTransitioning: false,
  };

  const mockRouterNavLink = vi.fn(
    ({
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
    },
  );

  return { mockRouterNavLink };
});

vi.mock('react-router', () => ({
  NavLink: mockRouterNavLink,
}));

import { hasStylexStyle } from '#ui/utils/tests/hasStylexStyle.util';

import type { NavLinkProps, NavLinkVariant } from './NavLink.types';

import { NavLink } from './NavLink.component';
import { linkItemStyles } from './NavLink.stylex';

afterEach(() => {
  cleanup();
  mockRouterNavLink.mockClear();
});

const getRouterProps = () => {
  const props = mockRouterNavLink.mock.lastCall?.[0];

  if (props === undefined) throw new Error('The router NavLink never rendered');

  return props;
};

const getClassNameFor = (renderProps: Partial<NavLinkRenderProps>) => {
  const { className } = getRouterProps();

  if (typeof className !== 'function') {
    throw new TypeError('NavLink must pass a className render function');
  }

  return (
    className({
      isActive: false,
      isPending: false,
      isTransitioning: false,
      ...renderProps,
    }) ?? ''
  );
};

type HasStyleArgs = {
  readonly classNames: string;
  readonly style: StyleXStyles;
};

const hasStyle = ({ classNames, style }: HasStyleArgs) =>
  (stylex.props(style).className ?? '')
    .split(' ')
    .every((name) => classNames.split(' ').includes(name));

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

    const iconSlot = screen.getByText('icon-element').parentElement;

    expect(
      hasStylexStyle({
        element: iconSlot as Element,
        style: linkItemStyles.icon,
      }),
    ).toBe(true);
    expect(
      hasStylexStyle({
        element: iconSlot as Element,
        style: linkItemStyles.inline.icon,
      }),
    ).toBe(false);
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

describe('NavLink variants', () => {
  it('keeps the button look for the default variant and no inline styles', () => {
    render(<NavLink to='/home'>Home</NavLink>);

    const link = screen.getByRole('link', { name: 'Home' });

    expect(
      hasStylexStyle({ element: link, style: linkItemStyles.fullWidth }),
    ).toBe(true);
    expect(
      hasStylexStyle({ element: link, style: linkItemStyles.variant.outline }),
    ).toBe(true);
    expect(
      hasStylexStyle({ element: link, style: linkItemStyles.inline.link }),
    ).toBe(false);
    expect(
      hasStylexStyle({
        element: screen.getByText('Home'),
        style: linkItemStyles.label,
      }),
    ).toBe(true);
  });

  it('renders the inline variant without the button base, size or variant styles', () => {
    render(
      <NavLink size='lg' to='/docs' variant='inline'>
        Docs
      </NavLink>,
    );

    const link = screen.getByRole('link', { name: 'Docs' });

    expect(
      hasStylexStyle({ element: link, style: linkItemStyles.inline.link }),
    ).toBe(true);
    expect(
      hasStylexStyle({ element: link, style: linkItemStyles.variant.outline }),
    ).toBe(false);
    expect(
      hasStylexStyle({ element: link, style: linkItemStyles.size.lg }),
    ).toBe(false);
    expect(
      hasStylexStyle({ element: link, style: linkItemStyles.fullWidth }),
    ).toBe(false);
    expect(
      hasStylexStyle({
        element: screen.getByText('Docs'),
        style: linkItemStyles.label,
      }),
    ).toBe(false);
  });

  it('styles the inline active and pending states from the router render props', () => {
    render(
      <NavLink to='/docs' variant='inline'>
        Docs
      </NavLink>,
    );

    const idle = getClassNameFor({});
    const active = getClassNameFor({ isActive: true });
    const pending = getClassNameFor({ isPending: true });

    expect(
      hasStyle({ classNames: idle, style: linkItemStyles.inline.active }),
    ).toBe(false);
    expect(
      hasStyle({ classNames: idle, style: linkItemStyles.inline.pending }),
    ).toBe(false);
    expect(
      hasStyle({ classNames: active, style: linkItemStyles.inline.active }),
    ).toBe(true);
    expect(
      hasStyle({ classNames: active, style: linkItemStyles.inline.pending }),
    ).toBe(false);
    expect(
      hasStyle({ classNames: pending, style: linkItemStyles.inline.pending }),
    ).toBe(true);
    expect(
      hasStyle({ classNames: pending, style: linkItemStyles.inline.active }),
    ).toBe(false);
  });

  it('applies the button active style, not the inline one, for a button variant', () => {
    render(<NavLink to='/home'>Home</NavLink>);

    const active = getClassNameFor({ isActive: true });

    expect(hasStyle({ classNames: active, style: linkItemStyles.active })).toBe(
      true,
    );
    expect(
      hasStyle({ classNames: active, style: linkItemStyles.inline.active }),
    ).toBe(false);
  });

  it('applies customStylex last on the inline variant', () => {
    render(
      <NavLink
        customStylex={linkItemStyles.labelHidden}
        to='/docs'
        variant='inline'
      >
        Docs
      </NavLink>,
    );

    expect(
      hasStyle({
        classNames: getClassNameFor({}),
        style: linkItemStyles.labelHidden,
      }),
    ).toBe(true);
  });

  it('keeps an inline busy link non-interactive with its shimmer', () => {
    const { container } = render(
      <NavLink isBusy to='/docs' variant='inline'>
        Docs
      </NavLink>,
    );

    const link = screen.getByRole('link', { name: 'Docs' });

    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(container.querySelector(`.${busyWaveClass}`)).not.toBeNull();
    expect(
      hasStylexStyle({ element: link, style: linkItemStyles.busyLink }),
    ).toBe(true);
  });

  it('flows an inline icon with the text instead of the button icon box', () => {
    render(
      <NavLink icon={<span>icon-element</span>} to='/docs' variant='inline'>
        Docs
      </NavLink>,
    );

    const iconSlot = screen.getByText('icon-element').parentElement;

    expect(iconSlot).not.toBeNull();
    expect(
      hasStylexStyle({
        element: iconSlot as Element,
        style: linkItemStyles.inline.icon,
      }),
    ).toBe(true);
    expect(
      hasStylexStyle({
        element: iconSlot as Element,
        style: linkItemStyles.icon,
      }),
    ).toBe(false);
  });

  it('passes viewTransition, reloadDocument and state to the router NavLink, prefetching on intent by default', () => {
    render(
      <NavLink
        reloadDocument
        state={{ from: 'list' }}
        to='/docs'
        variant='inline'
        viewTransition
      >
        Docs
      </NavLink>,
    );

    expect(getRouterProps()).toMatchObject({
      prefetch: 'intent',
      reloadDocument: true,
      state: { from: 'list' },
      to: '/docs',
      viewTransition: true,
    });
  });

  it('passes an explicit prefetch mode to the router NavLink', () => {
    render(
      <NavLink prefetch='render' to='/docs' variant='inline'>
        Docs
      </NavLink>,
    );

    expect(getRouterProps().prefetch).toBe('render');
  });
});

describe('NavLinkProps', () => {
  it('rejects an icon-only inline link, which would have no accessible name', () => {
    expectTypeOf<{
      readonly children: string;
      readonly isIconOnly: true;
      readonly to: string;
      readonly variant: 'inline';
    }>().not.toExtend<NavLinkProps>();
  });

  it('accepts an inline link with text, and an icon-only button variant', () => {
    expectTypeOf<{
      readonly children: string;
      readonly to: string;
      readonly variant: 'inline';
    }>().toExtend<NavLinkProps>();
    expectTypeOf<{
      readonly children: string;
      readonly isIconOnly: false;
      readonly to: string;
      readonly variant: 'inline';
    }>().toExtend<NavLinkProps>();
    expectTypeOf<{
      readonly children: string;
      readonly isIconOnly: true;
      readonly to: string;
      readonly variant: 'ghost';
    }>().toExtend<NavLinkProps>();
    expectTypeOf<{
      readonly children: string;
      readonly isIconOnly: true;
      readonly to: string;
    }>().toExtend<NavLinkProps>();
  });
});

describe('NavLinkProps isActive', () => {
  it('takes an optional boolean isActive', () => {
    expectTypeOf<NavLinkProps['isActive']>().toEqualTypeOf<
      boolean | undefined
    >();
  });

  it('leaves the router NavLink in charge when isActive is unset', () => {
    render(
      <NavLink to='/docs' variant='inline'>
        Docs
      </NavLink>,
    );

    expect(mockRouterNavLink).toHaveBeenCalledTimes(1);
  });
});

describe('NavLinkVariant', () => {
  it('is every variant NavLinkProps accepts', () => {
    expectTypeOf<NavLinkVariant>().toEqualTypeOf<
      | 'danger-ghost'
      | 'error'
      | 'ghost'
      | 'inline'
      | 'outline'
      | 'primary'
      | 'secondary'
      | 'success'
      | 'warning'
    >();
  });
});
