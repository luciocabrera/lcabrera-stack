// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vite-plus/test';

import { AppProviders } from '#ui/components/AppProviders';
import { inferTableColumnsFromJson } from '#ui/components/Table/utils/inferTableColumnsFromJson.util';

import { JsonExplorer } from './JsonExplorer.component';

afterEach(cleanup);

const rows = [
  { file: 'src/a.ts', line: 12, rule: 'no-var' },
  { file: 'src/b.ts', line: 4, rule: 'eqeqeq' },
];

// Table's column-sort action needs both a real data router (useFetcher) and
// NotificationProvider (error-toasting on a failed persist) — the same
// stack any real route already sits inside via <AppProviders>/root.tsx.
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

describe('JsonExplorer', () => {
  beforeAll(() => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
  });

  it('renders one tab per section and the first section active by default', () => {
    renderWithRouter(
      <JsonExplorer
        sections={[
          {
            columns: inferTableColumnsFromJson({ rows }),
            label: 'Findings',
            rows,
          },
          {
            columns: inferTableColumnsFromJson({ rows: [] }),
            label: 'Metrics',
            rows: [],
          },
        ]}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Findings' })).toBeDefined();
    expect(screen.getByRole('tab', { name: 'Metrics' })).toBeDefined();
    expect(screen.getByText('src/a.ts')).toBeDefined();
    expect(screen.getByText('src/b.ts')).toBeDefined();
  });

  it('renders a copy button for the active section', () => {
    renderWithRouter(
      <JsonExplorer
        sections={[
          {
            columns: inferTableColumnsFromJson({ rows }),
            label: 'Findings',
            rows,
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Copy raw JSON' })).toBeDefined();
  });
});
