// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { Order } from './orders.types';

import { Orders } from './Orders.component';
import { loader } from './orders.loader';

type OrderArgs = {
  readonly customer: string;
  readonly orderId: number;
};

const order = ({ customer, orderId }: OrderArgs): Order => ({
  customer_name: customer,
  customer_type: 'Business',
  order_date: '2026-01-01',
  order_id: orderId,
  order_number: `ORD-${orderId}`,
  order_status: 'Pending',
  payment_status: 'Paid',
  priority: 'Normal',
  product_category: 'Tools',
  quantity: 1,
  shipping_country: 'Norway',
  total_amount: '10.00',
  unit_price: '10.00',
});

const PAGE = [
  order({ customer: 'Zeta Supply', orderId: 3 }),
  order({ customer: 'Alpha Freight', orderId: 1 }),
];

vi.mock('./.server/orders.reader', () => ({
  selectGroupingCapabilities: vi.fn(async () => ({})),
  selectPage: vi.fn(async () => ({
    data: PAGE,
    hasMore: false,
    total: PAGE.length,
  })),
}));

afterEach(cleanup);

const renderAt = (search: string) =>
  render(
    <RouterProvider
      router={createMemoryRouter([{ Component: Orders, loader, path: '/' }], {
        initialEntries: [`/${search}`],
      })}
    />,
  );

const sortedBy = (column: string) =>
  `?sorting=${encodeURIComponent(JSON.stringify({ [column]: 'desc' }))}`;

describe('the orders route', () => {
  it('renders the rows in the order the read returned them', async () => {
    renderAt('');

    const customers = await screen.findAllByText(/Zeta Supply|Alpha Freight/);

    expect(customers.map((cell) => cell.textContent)).toEqual([
      'Zeta Supply',
      'Alpha Freight',
    ]);
  });

  it('announces the sort the request named on that column’s header', async () => {
    renderAt(sortedBy('total_amount'));
    await screen.findByRole('grid');

    const headers = await screen.findAllByRole('columnheader');
    const announced = headers
      .map((header) => [header.textContent, header.getAttribute('aria-sort')])
      .filter(([, sort]) => sort !== null && sort !== 'none');

    expect(announced).toEqual([
      [expect.stringMatching(/^Total/), 'descending'],
    ]);
  });
});
