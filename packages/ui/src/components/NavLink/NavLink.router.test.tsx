// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub, MemoryRouter } from 'react-router';
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
