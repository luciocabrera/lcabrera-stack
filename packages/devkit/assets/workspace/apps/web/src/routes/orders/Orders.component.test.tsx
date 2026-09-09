// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Orders } from './Orders.component';
import { COLUMNS, PAGE_LIMIT } from './Orders.constants';
import { loader } from './orders.loader';
import { ORDER_ROWS } from './orders.rows';
import { readOrdersPage } from './readOrdersPage.util';

afterEach(cleanup);

const HEADER_ROW = 1;

const renderRoute = () =>
  render(
    <RouterProvider
      router={createMemoryRouter([{ Component: Orders, loader, path: '/' }])}
    />,
  );

const firstOrder = () => {
  const [first] = ORDER_ROWS;
  if (first === undefined) throw new Error('ORDER_ROWS holds no row');
  return first;
};

describe('the orders route', () => {
  it('renders a grid from the rows alone, with no server behind it', async () => {
    renderRoute();

    expect(await screen.findByRole('grid')).toBeDefined();
  });

  it('renders a header for every column it declares, and no others', async () => {
    renderRoute();
    await screen.findByRole('grid');

    const headers = await screen.findAllByRole('columnheader');
    const labelled = headers.map((header, index) => {
      const label = COLUMNS[index]?.label ?? '';
      return header.textContent?.startsWith(label) === true
        ? label
        : header.textContent;
    });

    expect(labelled).toEqual(COLUMNS.map((column) => column.label));
  });

  it('renders the first row it was given', async () => {
    const { customer } = firstOrder();

    renderRoute();

    expect(await screen.findAllByText(customer)).not.toHaveLength(0);
  });

  it('announces no header as sortable, offering no sort the loader cannot apply', async () => {
    renderRoute();
    await screen.findByRole('grid');

    const headers = await screen.findAllByRole('columnheader');
    const announced = headers
      .filter((header) => header.getAttribute('aria-sort') !== null)
      .map((header) => header.textContent);

    expect(announced).toEqual([]);
  });

  it('counts no more rows than the page behind it delivers', async () => {
    const page = await readOrdersPage({ limit: PAGE_LIMIT, skip: 0 });

    renderRoute();

    const grid = await screen.findByRole('grid');

    expect(grid.getAttribute('aria-rowcount')).toBe(
      String(page.data.length + HEADER_ROW),
    );
  });
});
