// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { Orders } from './Orders.component';
import { loader } from './orders.loader';
import { ORDER_ROWS } from './orders.rows';

afterEach(cleanup);

const renderRoute = () =>
  render(
    <RouterProvider
      router={createMemoryRouter([{ Component: Orders, loader, path: '/' }])}
    />,
  );

describe('the orders route', () => {
  it('renders a grid from the rows alone, with no server behind it', async () => {
    renderRoute();

    expect(await screen.findByRole('grid')).toBeDefined();
  });

  it('renders a header for every column it declares', async () => {
    renderRoute();
    await screen.findByRole('grid');

    expect(await screen.findAllByText('Customer')).not.toHaveLength(0);
    expect(await screen.findAllByText('Total')).not.toHaveLength(0);
  });

  it('renders the first row it was given', async () => {
    renderRoute();

    const [first] = ORDER_ROWS;

    expect(await screen.findAllByText(first?.customer ?? '')).not.toHaveLength(
      0,
    );
  });
});
