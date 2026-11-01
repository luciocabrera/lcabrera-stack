// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { createRoutesStub, MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { expectServerMarkupMatchesClient } from '#ui/utils/tests/expectServerMarkupMatchesClient.util';
import { hasStylexStyle } from '#ui/utils/tests/hasStylexStyle.util';

import type { BreadcrumbItem } from './Breadcrumbs.types';

import { Breadcrumbs } from './Breadcrumbs.component';
import { styles } from './Breadcrumbs.stylex';

afterEach(cleanup);

const ITEMS: readonly BreadcrumbItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Projects' },
  {
    label: 'Reports',
    to: { pathname: '/projects/reports', search: '?page=2' },
  },
  { label: 'Quarterly', to: '/projects/reports/quarterly' },
];

type RenderInMemoryRouterArgs = {
  readonly items: readonly BreadcrumbItem[];
  readonly label?: string;
};

const renderInMemoryRouter = ({ items, label }: RenderInMemoryRouterArgs) =>
  render(
    <MemoryRouter>
      <Breadcrumbs items={items} label={label} />
    </MemoryRouter>,
  );

describe('Breadcrumbs', () => {
  it('renders a navigation landmark named Breadcrumb holding an ordered list', () => {
    renderInMemoryRouter({ items: ITEMS });

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const list = within(nav).getByRole('list');

    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(ITEMS.length);
  });

  it('names the landmark from the label prop', () => {
    renderInMemoryRouter({ items: ITEMS, label: 'You are here' });

    expect(
      screen.getByRole('navigation', { name: 'You are here' }),
    ).not.toBeNull();
  });

  it('links every earlier item that has a destination', () => {
    renderInMemoryRouter({ items: ITEMS });

    const home = screen.getByRole('link', { name: 'Home' });
    const reports = screen.getByRole('link', { name: 'Reports' });

    expect(home.getAttribute('href')).toBe('/');
    expect(reports.getAttribute('href')).toBe('/projects/reports?page=2');
    expect(hasStylexStyle({ element: reports, style: styles.link })).toBe(true);
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('renders an earlier item without a destination as text', () => {
    renderInMemoryRouter({ items: ITEMS });

    const projects = screen.getByText('Projects');

    expect(projects.closest('a')).toBeNull();
    expect(projects.getAttribute('aria-current')).toBeNull();
  });

  it('renders the last item as text marked as the current page, even when it has a destination', () => {
    renderInMemoryRouter({ items: ITEMS });

    const current = screen.getByText('Quarterly');

    expect(screen.queryByRole('link', { name: 'Quarterly' })).toBeNull();
    expect(current.tagName).toBe('SPAN');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(hasStylexStyle({ element: current, style: styles.current })).toBe(
      true,
    );
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it('separates the items with a decorative separator hidden from assistive technology', () => {
    const { container } = renderInMemoryRouter({ items: ITEMS });

    const separators = container.querySelectorAll('[aria-hidden="true"]');

    expect(separators).toHaveLength(ITEMS.length - 1);
    expect(
      [...separators].every((separator) =>
        hasStylexStyle({ element: separator, style: styles.separator }),
      ),
    ).toBe(true);
    expect(
      within(screen.getByRole('list'))
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Home/', 'Projects/', 'Reports/', 'Quarterly']);
    expect(screen.getByRole('link', { name: 'Home' }).textContent).toBe('Home');
  });

  it('renders a single item as the current page with no separator', () => {
    const { container } = renderInMemoryRouter({
      items: [{ label: 'Home', to: '/' }],
    });

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Home').getAttribute('aria-current')).toBe('page');
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('renders nothing for an empty trail', () => {
    const { container } = renderInMemoryRouter({ items: [] });

    expect(container.firstChild).toBeNull();
  });

  it('keeps items that share a label apart', () => {
    renderInMemoryRouter({
      items: [
        { label: 'Section', to: '/a' },
        { label: 'Section', to: '/a/b' },
        { label: 'Section' },
      ],
    });

    expect(screen.getAllByText('Section')).toHaveLength(3);
  });

  it('navigates through a router Link under a data router', async () => {
    const Stub = createRoutesStub([
      {
        Component: () => (
          <Breadcrumbs
            items={[{ label: 'Home', to: '/' }, { label: 'Settings' }]}
          />
        ),
        path: '/settings',
      },
      { Component: () => <p>Home page</p>, path: '/' },
    ]);

    render(<Stub initialEntries={['/settings']} />);

    const home = await screen.findByRole('link', { name: 'Home' });

    home.click();

    expect(await screen.findByText('Home page')).not.toBeNull();
  });

  it('throws when an item links and no router is mounted', () => {
    expect(() => render(<Breadcrumbs items={ITEMS} />)).toThrow(TypeError);
  });

  it('renders the same markup on the server as on the client', () => {
    expectServerMarkupMatchesClient(
      <MemoryRouter>
        <Breadcrumbs items={ITEMS} label='Trail' />
      </MemoryRouter>,
    );
  });
});
