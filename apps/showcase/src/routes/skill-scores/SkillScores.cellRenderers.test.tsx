// @vitest-environment jsdom

import type { TableCellRenderer } from '@lcabrera/ui/components/Table/Table.types';
import type { ReactNode } from 'react';

import { AppProviders } from '@lcabrera/ui';
import { TableLayout } from '@lcabrera/ui/components/Table/TableLayout';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import {
  createMemoryRouter,
  RouterProvider,
  useLoaderData,
} from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { z } from 'zod';

import type { SkillScoreRow, SkillScoresResponse } from './SkillScores.types';

import { loader } from './skill-scores.loader';
import { SkillScores } from './SkillScores.component';

type CellAt = { readonly columnKey: string; readonly skill: string };

const starParams = z.object({ max: z.number().int().positive() }).strict();

const STARS: TableCellRenderer<z.infer<typeof starParams>> = {
  kind: 'stars',
  params: starParams,
  render: ({ params, value }) => {
    const filled = Math.round(Number(value));

    return (
      <span data-testid='stars'>
        {'★'.repeat(filled)}
        {'☆'.repeat(Math.max(params.max - filled, 0))}
      </span>
    );
  },
};

const StarredScores = ({ max }: { readonly max: number }) => {
  const { columnsState, dataPromise, metaState } =
    useLoaderData<typeof loader>();
  const columns = columnsState.columns.map((column) =>
    column.key === 'clarity'
      ? {
          ...column,
          cell: { kind: 'stars', params: { max } },
        }
      : column,
  );

  return (
    <TableLayout<SkillScoreRow, SkillScoresResponse>
      cellRenderers={[STARS]}
      columnsState={{ ...columnsState, columns }}
      dataPromise={dataPromise}
      dataSelector={(response) => response.data}
      metaState={metaState}
    />
  );
};

const renderRoute = async (element: ReactNode) => {
  const router = createMemoryRouter(
    [
      { element: <AppProviders>{element}</AppProviders>, loader, path: '/' },
      { action: async () => ({ ok: true }), path: '/_action/persist-cookie' },
    ],
    { initialEntries: ['/'] },
  );

  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  await screen.findAllByRole('gridcell');
};

const cellOf = ({ columnKey, skill }: CellAt) => {
  const row = screen.getByText(skill).closest('[role="row"]');
  const cell = row?.querySelector(
    `[data-column-key="${CSS.escape(columnKey)}"]`,
  );

  if (!(cell instanceof HTMLElement)) {
    throw new TypeError(`no ${columnKey} cell for ${skill}`);
  }

  return cell;
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('skill scores grid', () => {
  it('draws every built-in kind from the data its loader returns', async () => {
    await renderRoute(<SkillScores />);

    expect(
      within(cellOf({ columnKey: 'clarity', skill: 'epic' })).getByTestId(
        'table-cell-badge',
      ).textContent,
    ).toBe('4');
    expect(cellOf({ columnKey: 'overall', skill: 'epic' }).textContent).toBe(
      '3.8',
    );
    expect(cellOf({ columnKey: 'skill', skill: 'epic' }).textContent).toBe(
      'epic',
    );
    expect(
      cellOf({ columnKey: 'change', skill: 'store-pattern' }).textContent,
    ).toBe('▼ 0.2');
  });

  it('paints the tone only its loader defines with the loader’s colours', async () => {
    await renderRoute(<SkillScores />);

    const caution = within(
      cellOf({
        columnKey: 'trigger_precision',
        skill: 'typescript-api-engineering',
      }),
    ).getByTestId('table-cell-badge');

    expect(caution.textContent).toBe('2');
    expect(caution.getAttribute('style')).toContain('oklch(0.75 0.15 55)');
  });

  it('runs a renderer the application registers with a Zod schema', async () => {
    await renderRoute(<StarredScores max={4} />);

    expect(
      within(cellOf({ columnKey: 'clarity', skill: 'epic' })).getByTestId(
        'stars',
      ).textContent,
    ).toBe('★★★★');
  });

  it('renders the dataType default when the Zod schema rejects the params', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await renderRoute(<StarredScores max={-1} />);

    const cell = cellOf({ columnKey: 'clarity', skill: 'epic' });

    expect(within(cell).queryByTestId('stars')).toBeNull();
    expect(cell.textContent).toBe('4');
  });
});
