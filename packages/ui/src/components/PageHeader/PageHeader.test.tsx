// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { createRoutesStub, MemoryRouter, Outlet } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { BreadcrumbHandle } from '#ui/components/Breadcrumbs';

import { Text } from '#ui/components/Text';
import { styles as titleStyles } from '#ui/components/Title/Title.stylex';
import { expectServerMarkupMatchesClient } from '#ui/utils/tests/expectServerMarkupMatchesClient.util';
import { hasStylexStyle } from '#ui/utils/tests/hasStylexStyle.util';

import type { PageHeaderProps } from './PageHeader.types';

import { PageHeader } from '.';

afterEach(cleanup);

const BREADCRUMBS = [{ label: 'Home', to: '/' }, { label: 'Reports' }];

const renderInMemoryRouter = (props: PageHeaderProps) =>
  render(
    <MemoryRouter>
      <PageHeader {...props} />
    </MemoryRouter>,
  );

const rootHandle: BreadcrumbHandle = {
  breadcrumb: () => ({ label: 'Home', to: '/' }),
};

const reportsHandle: BreadcrumbHandle = {
  breadcrumb: () => ({ label: 'Reports' }),
};

describe('PageHeader', () => {
  it('renders exactly one h1, a plain level-1 Title holding the title', () => {
    renderInMemoryRouter({
      actions: <button type='button'>Export</button>,
      breadcrumbs: BREADCRUMBS,
      description: 'Every report filed this quarter.',
      title: 'Reports',
    });

    const headings = screen.getAllByRole('heading', { level: 1 });

    expect(headings).toHaveLength(1);
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    expect(headings[0]?.textContent).toBe('Reports');
    expect(
      hasStylexStyle({
        element: headings[0] as Element,
        style: titleStyles.plainLevel[1],
      }),
    ).toBe(true);
    expect(screen.queryAllByRole('heading')).toHaveLength(1);
  });

  it('renders the given breadcrumbs above the heading', () => {
    renderInMemoryRouter({ breadcrumbs: BREADCRUMBS, title: 'Reports' });

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });

    expect(within(nav).getByRole('link', { name: 'Home' })).not.toBeNull();
    expect(
      nav.compareDocumentPosition(screen.getByRole('heading', { level: 1 })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders no breadcrumb landmark for an empty trail', () => {
    renderInMemoryRouter({ breadcrumbs: [], title: 'Reports' });

    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('renders the description as secondary text', () => {
    renderInMemoryRouter({
      breadcrumbs: [],
      description: <strong>Filed this quarter</strong>,
      title: 'Reports',
    });

    const description = screen.getByText('Filed this quarter').parentElement;

    expect(description?.tagName).toBe('DIV');
    expect(description?.className).toBe(
      render(
        <Text as='div' tone='secondary'>
          Reference
        </Text>,
      ).getByText('Reference').className,
    );
  });

  it('omits the description when none is given', () => {
    const { container } = renderInMemoryRouter({
      breadcrumbs: [],
      title: 'Reports',
    });

    const header = container.querySelector('header');

    expect(header?.childElementCount).toBe(1);
  });

  it('renders the actions beside the heading', () => {
    renderInMemoryRouter({
      actions: <button type='button'>Export</button>,
      breadcrumbs: [],
      title: 'Reports',
    });

    const action = screen.getByRole('button', { name: 'Export' });

    expect(
      hasStylexStyle({
        element: action.parentElement as Element,
        style: titleStyles.actions,
      }),
    ).toBe(true);
  });

  it('never sets the document title', () => {
    document.title = 'Set by the route meta';

    renderInMemoryRouter({ breadcrumbs: BREADCRUMBS, title: 'Reports' });

    expect(document.title).toBe('Set by the route meta');
    expect(document.querySelector('title')?.textContent).toBe(
      'Set by the route meta',
    );
  });

  it('defaults the breadcrumbs to the matched route handles', async () => {
    const Stub = createRoutesStub([
      {
        children: [
          {
            Component: () => <PageHeader title='Reports' />,
            handle: reportsHandle,
            path: 'reports',
          },
        ],
        Component: Outlet,
        handle: rootHandle,
        path: '/',
      },
    ]);

    render(<Stub initialEntries={['/reports']} />);

    const nav = await screen.findByRole('navigation', { name: 'Breadcrumb' });

    expect(within(nav).getByRole('link', { name: 'Home' })).not.toBeNull();
    expect(within(nav).getByText('Reports').getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('throws without a data router when no breadcrumbs are given', () => {
    expect(() =>
      render(
        <MemoryRouter>
          <PageHeader title='Reports' />
        </MemoryRouter>,
      ),
    ).toThrow(/data router/);
  });

  it('renders explicit breadcrumbs without a data router', () => {
    renderInMemoryRouter({ breadcrumbs: BREADCRUMBS, title: 'Reports' });

    expect(screen.getByRole('navigation')).not.toBeNull();
  });

  it('renders the same markup on the server as on the client', () => {
    expectServerMarkupMatchesClient(
      <MemoryRouter>
        <PageHeader
          actions={<button type='button'>Export</button>}
          breadcrumbs={BREADCRUMBS}
          description='Every report filed this quarter.'
          title='Reports'
        />
      </MemoryRouter>,
    );
  });

  it('renders the same route-derived markup on the server as on the client', () => {
    const Stub = createRoutesStub([
      {
        children: [
          {
            Component: () => <PageHeader title='Reports' />,
            handle: reportsHandle,
            path: 'reports',
          },
        ],
        Component: Outlet,
        handle: rootHandle,
        path: '/',
      },
    ]);

    expectServerMarkupMatchesClient(<Stub initialEntries={['/reports']} />);

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Reports',
    );
    expect(
      screen.getByRole('navigation', { name: 'Breadcrumb' }),
    ).not.toBeNull();
  });
});
