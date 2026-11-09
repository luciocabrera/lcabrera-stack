// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRoutesStub, MemoryRouter, useSearchParams } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { expectServerMarkupMatchesClient } from '#ui/utils/tests/expectServerMarkupMatchesClient.util';
import { hasStylexStyle } from '#ui/utils/tests/hasStylexStyle.util';

import { NavLink } from './NavLink.component';
import { linkItemStyles } from './NavLink.stylex';

afterEach(cleanup);

const renderInlineLinks = async (path: string) => {
  const Stub = createRoutesStub([
    {
      children: [
        { Component: () => <p>Docs page</p>, path: 'docs' },
        { Component: () => <p>Guide page</p>, path: 'guide' },
      ],
      Component: () => (
        <p>
          Read the{' '}
          <NavLink to='/docs' variant='inline'>
            docs
          </NavLink>{' '}
          or the{' '}
          <NavLink to='/guide' variant='inline'>
            guide
          </NavLink>
          .
        </p>
      ),
      path: '/',
    },
  ]);

  render(<Stub initialEntries={[path]} />);
  await screen.findByRole('link', { name: 'docs' });
};

describe('NavLink inline under a data router', () => {
  it('marks only the link to the current route as the current page', async () => {
    await renderInlineLinks('/docs');

    const docs = screen.getByRole('link', { name: 'docs' });
    const guide = screen.getByRole('link', { name: 'guide' });

    expect(docs.getAttribute('href')).toBe('/docs');
    expect(docs.getAttribute('aria-current')).toBe('page');
    expect(guide.getAttribute('aria-current')).toBeNull();
    expect(
      hasStylexStyle({ element: docs, style: linkItemStyles.inline.active }),
    ).toBe(true);
    expect(
      hasStylexStyle({ element: guide, style: linkItemStyles.inline.active }),
    ).toBe(false);
    expect(
      hasStylexStyle({ element: guide, style: linkItemStyles.inline.link }),
    ).toBe(true);
  });

  it('is an ordinary focusable link', async () => {
    await renderInlineLinks('/guide');

    const docs = screen.getByRole('link', { name: 'docs' });
    docs.focus();

    expect(document.activeElement).toBe(docs);
  });

  it('can leave the tab order when a containing cell holds the single tab stop', async () => {
    const Stub = createRoutesStub([
      {
        Component: () => (
          <NavLink tabIndex={-1} to='/docs' variant='inline'>
            docs
          </NavLink>
        ),
        path: '/',
      },
    ]);

    render(<Stub />);

    const link = await screen.findByRole('link', { name: 'docs' });

    expect(link.getAttribute('tabindex')).toBe('-1');
  });

  it('throws when rendered outside a router', () => {
    expect(() =>
      render(
        <NavLink to='/docs' variant='inline'>
          docs
        </NavLink>,
      ),
    ).toThrow(/<Router>/);
  });

  it('renders the same markup on the server as on the client', () => {
    expectServerMarkupMatchesClient(
      <MemoryRouter initialEntries={['/docs']}>
        <NavLink to='/docs' variant='inline' viewTransition>
          docs
        </NavLink>
      </MemoryRouter>,
    );
  });
});

const VIEWS = ['a', 'b'] as const;

const ViewPicker = () => {
  const [params] = useSearchParams();
  const current = params.get('view');

  return (
    <nav aria-label='Views'>
      {VIEWS.map((view) => (
        <NavLink
          isActive={view === current}
          key={view}
          to={`?view=${view}`}
          variant='inline'
        >
          {`view ${view}`}
        </NavLink>
      ))}
    </nav>
  );
};

const renderViewPicker = async (path: string) => {
  const Stub = createRoutesStub([{ Component: ViewPicker, path: '/views' }]);

  render(<Stub initialEntries={[path]} />);
  await screen.findByRole('link', { name: 'view a' });
};

describe('NavLink isActive under a data router', () => {
  it('marks the overridden link current where the pathname alone matches every link', async () => {
    await renderViewPicker('/views?view=b');

    const first = screen.getByRole('link', { name: 'view a' });
    const second = screen.getByRole('link', { name: 'view b' });

    expect(first.getAttribute('href')).toBe('/views?view=a');
    expect(first.getAttribute('aria-current')).toBeNull();
    expect(second.getAttribute('aria-current')).toBe('page');
    expect(
      hasStylexStyle({ element: second, style: linkItemStyles.inline.active }),
    ).toBe(true);
    expect(
      hasStylexStyle({ element: first, style: linkItemStyles.inline.active }),
    ).toBe(false);
    expect(
      [first, second].some((link) =>
        hasStylexStyle({ element: link, style: linkItemStyles.inline.pending }),
      ),
    ).toBe(false);
  });

  it('follows the override when the location changes', async () => {
    await renderViewPicker('/views?view=b');

    fireEvent.click(screen.getByRole('link', { name: 'view a' }));

    await waitFor(() => {
      expect(
        screen
          .getByRole('link', { name: 'view a' })
          .getAttribute('aria-current'),
      ).toBe('page');
    });
    expect(
      screen.getByRole('link', { name: 'view b' }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it('marks no link when the override is false for all of them', async () => {
    await renderViewPicker('/views');

    expect(
      screen
        .getAllByRole('link')
        .filter((link) => link.hasAttribute('aria-current')),
    ).toHaveLength(0);
  });

  it('marks a link the router would not match when the override says so', async () => {
    const Stub = createRoutesStub([
      {
        Component: () => (
          <NavLink isActive to='/elsewhere' variant='inline'>
            elsewhere
          </NavLink>
        ),
        path: '/here',
      },
    ]);

    render(<Stub initialEntries={['/here']} />);

    const link = await screen.findByRole('link', { name: 'elsewhere' });

    expect(link.getAttribute('aria-current')).toBe('page');
  });

  it('keeps the router match options off the rendered anchor', async () => {
    const Stub = createRoutesStub([
      {
        Component: () => (
          <NavLink
            caseSensitive
            end
            isActive={false}
            to='/docs'
            variant='inline'
          >
            docs
          </NavLink>
        ),
        path: '/docs',
      },
    ]);

    render(<Stub initialEntries={['/docs']} />);

    const link = await screen.findByRole('link', { name: 'docs' });

    expect(
      link
        .getAttributeNames()
        .toSorted((left, right) => left.localeCompare(right)),
    ).toEqual(['class', 'data-discover', 'href']);
  });

  it('renders an overridden link the same on the server as on the client', () => {
    expectServerMarkupMatchesClient(
      <MemoryRouter initialEntries={['/views?view=a']}>
        <NavLink isActive to='?view=a' variant='inline'>
          view a
        </NavLink>
      </MemoryRouter>,
    );
  });
});
