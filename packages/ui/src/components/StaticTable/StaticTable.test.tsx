// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { AppProviders } from '@repo/ui/components/AppProviders';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { StaticTable } from './StaticTable.component';

afterEach(cleanup);

type Row = { readonly id: string; readonly name: string };

const rows: readonly Row[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
];

// Table's column-sort action needs both a real data router (useFetcher) and
// NotificationProvider — the same stack any real route already sits inside.
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
});
