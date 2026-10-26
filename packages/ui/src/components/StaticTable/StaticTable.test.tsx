// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { AppProviders } from '#ui/components/AppProviders';

import { StaticTable } from './StaticTable.component';

afterEach(cleanup);

type Row = { readonly id: string; readonly name: string };

const rows: readonly Row[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
];

const renderWithRouter = (element: ReactNode) => {
  const router = createMemoryRouter(
    [
      { element: <AppProviders>{element}</AppProviders>, path: '/' },
      { action: async () => ({ ok: true }), path: '/_action/persist-cookie' },
    ],
    { initialEntries: ['/'] },
  );

  return render(<RouterProvider router={router} />);
};

describe('StaticTable', () => {
  it('renders every row for the given columns', () => {
    renderWithRouter(
      <StaticTable<Row>
        columns={[{ key: 'name', label: 'Name' }]}
        rows={rows}
      />,
    );

    expect(screen.getByText('Alpha')).toBeDefined();
    expect(screen.getByText('Beta')).toBeDefined();
  });

  it('renders rows alone, with columns inferred from their keys', () => {
    renderWithRouter(
      <StaticTable
        rows={[
          { label: 'Gamma', orderTotal: 12.5, placedOn: '2026-01-02' },
          { label: 'Delta', orderTotal: 3, placedOn: '2026-01-03' },
        ]}
      />,
    );

    expect(screen.getByText('Order Total')).toBeDefined();
    expect(screen.getByText('Placed On')).toBeDefined();
    expect(screen.getByText('Gamma')).toBeDefined();
    expect(screen.getByText('Delta')).toBeDefined();
  });
});
