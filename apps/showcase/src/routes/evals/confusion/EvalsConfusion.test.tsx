// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { breadcrumbTrail, evalsTrail } from '../utils/pageHeader.fixtures';
import { confusionSelection } from './confusionSelection.util';
import { EvalsConfusion } from './EvalsConfusion.component';
import {
  CORNER,
  EMPTY_CELL,
  EVALS_CONFUSION_HANDLE,
} from './EvalsConfusion.constants';

const RUN = { label: '2026-10-01 02:00 on main', runId: 'r1' };
const OTHER = { label: '2026-09-30 02:00 on main', runId: 'r0' };

const MATRIX = {
  columns: ['react-19', 'store-pattern', '(none)'],
  rows: [
    {
      cells: [
        { column: 'react-19', count: 2, isMisload: false, label: '2' },
        {
          column: 'store-pattern',
          count: 0,
          isMisload: false,
          label: EMPTY_CELL,
        },
        { column: '(none)', count: 1, isMisload: true, label: '1' },
      ],
      expected: 'react-19',
      trials: 3,
    },
  ],
};

type RenderAtArgs = {
  readonly matrix?: typeof MATRIX;
  readonly path: string;
};

const renderAt = async ({ matrix = MATRIX, path }: RenderAtArgs) => {
  const Stub = createRoutesStub([
    {
      Component: EvalsConfusion,
      handle: EVALS_CONFUSION_HANDLE,
      loader: ({ request }) => {
        const selection = confusionSelection(new URL(request.url).searchParams);
        const selectedRunId =
          selection.kind === 'run' ? selection.runId : undefined;

        return {
          choices: [RUN, OTHER],
          matrix,
          runs: selectedRunId === undefined ? [RUN, OTHER] : [RUN],
          selectedRunId,
        };
      },
      path: '/evals/confusion',
    },
  ]);

  render(<Stub initialEntries={[path]} />);
  await screen.findByRole('heading', { level: 1, name: 'Trigger confusion' });
};

const runTrigger = () => screen.getByRole('button', { name: /^Run / });

const openRunList = () => {
  fireEvent.click(runTrigger());

  return within(screen.getByRole('listbox', { name: 'Run' }));
};

afterEach(() => {
  cleanup();
});

describe('EvalsConfusion', () => {
  it('puts the page under a trail of the overview, then its own crumb', async () => {
    await renderAt({ path: '/evals/confusion' });

    expect(breadcrumbTrail()).toEqual(evalsTrail('confusion'));
  });

  it('offers recent runs and each run, with recent runs picked', async () => {
    await renderAt({ path: '/evals/confusion' });

    expect(runTrigger().textContent).toContain('Recent runs');
    expect(
      openRunList()
        .getAllByRole('button')
        .map(({ textContent }) => textContent),
    ).toEqual(['Recent runs', RUN.label, OTHER.label]);
    expect(screen.queryByRole('link', { name: 'Open the run' })).toBeNull();
  });

  it('picks the run named by ?run= and links to open it', async () => {
    await renderAt({ path: '/evals/confusion?run=r1' });

    expect(runTrigger().textContent).toContain(RUN.label);
    expect(
      screen.getByRole('link', { name: 'Open the run' }).getAttribute('href'),
    ).toBe('/evals/runs/r1');
  });

  it.each([
    { label: OTHER.label, link: '/evals/runs/r0' },
    { label: 'Recent runs', link: undefined },
  ])('navigates to $label when it is picked', async ({ label, link }) => {
    await renderAt({ path: '/evals/confusion?run=r1' });

    fireEvent.click(openRunList().getByRole('button', { name: label }));

    await waitFor(() => {
      expect(runTrigger().textContent).toContain(label);
    });
    expect(
      screen
        .queryByRole('link', { name: 'Open the run' })
        ?.getAttribute('href'),
    ).toBe(link);
  });

  it('draws the matrix, badging a misload and dimming an empty cell', async () => {
    await renderAt({ path: '/evals/confusion' });

    const table = screen.getByRole('table', {
      name: 'Skills loaded per expectation over the last 2 skills runs',
    });

    expect(
      within(table)
        .getAllByRole('columnheader')
        .map(({ textContent }) => textContent),
    ).toEqual([CORNER, 'react-19', 'store-pattern', '(none)', 'Trials']);

    const cells = [...table.querySelectorAll(':scope tbody td')];

    expect(cells.map(({ textContent }) => textContent)).toEqual([
      'react-19',
      '2',
      EMPTY_CELL,
      '1',
      '3',
    ]);
    expect(cells[1]?.children).toHaveLength(0);
    expect(cells[2]?.firstElementChild?.tagName).toBe('SPAN');
    expect(cells[3]?.firstElementChild?.tagName).toBe('SPAN');
    expect(cells[2]?.firstElementChild?.className).not.toBe(
      cells[3]?.firstElementChild?.className,
    );
  });

  it('says when the selection holds no trigger trial, and draws no table', async () => {
    await renderAt({
      matrix: { columns: [], rows: [] },
      path: '/evals/confusion?run=r1',
    });

    expect(
      screen.getByText(
        `No trigger or near-miss trial is stored for the run of ${RUN.label}.`,
      ),
    ).toBeDefined();
    expect(screen.queryByRole('table')).toBeNull();
  });
});
