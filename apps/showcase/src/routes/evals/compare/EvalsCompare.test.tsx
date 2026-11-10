// @vitest-environment jsdom

import type { LoaderFunctionArgs } from 'react-router';

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { breadcrumbTrail, evalsTrail } from '../utils/pageHeader.fixtures';
import { tableCells, tableHeaders } from '../utils/staticTable.fixtures';
import { EvalsCompare } from './EvalsCompare.component';
import { EVALS_COMPARE_HANDLE } from './EvalsCompare.constants';
import { runChoiceLabel } from './runChoiceLabel.util';

type RunArgs = {
  readonly rate: number;
  readonly runId: string;
};

const run = ({ rate, runId }: RunArgs) =>
  ({
    branch: 'main',
    k: Math.round(rate * 4),
    n: 4,
    rate,
    runId,
    startedAt: '2026-10-01T02:00:00.000Z',
    suite: 'skills',
  }) as RunFigures;

const FLIP = {
  a: '3/3',
  b: '1/3',
  change: 'regressed' as const,
  id: 'skills/t1',
  subjectKind: 'skill',
  subjectName: 'react-19',
  taskKey: 't1',
};

const COMPARISON = {
  a: run({ rate: 1, runId: 'run-a' }),
  b: run({ rate: 0.5, runId: 'run-b' }),
  changes: { changed: 'skill react-19 content', kind: 'single' as const },
  flips: [
    FLIP,
    {
      ...FLIP,
      a: '1/3',
      b: '3/3',
      change: 'improved' as const,
      id: 'skills/t2',
      taskKey: 't2',
    },
  ],
  tasks: 7,
  totals: [{ a: '100%', b: '50%', change: '-50 pts', metric: 'Pass rate' }],
};

const CHOICES = [
  run({ rate: 0.5, runId: 'run-newest' }),
  run({ rate: 1, runId: 'run-before' }),
];

const renderWith = (data: unknown) => {
  const loader = vi.fn<(args: LoaderFunctionArgs) => unknown>(() => data);
  const Stub = createRoutesStub([
    {
      Component: EvalsCompare,
      handle: EVALS_COMPARE_HANDLE,
      loader,
      path: '/evals/compare',
    },
  ]);

  render(<Stub initialEntries={['/evals/compare']} />);

  return loader;
};

const searchOfLastLoad = (loader: ReturnType<typeof renderWith>) =>
  new URL(loader.mock.lastCall?.[0].request.url ?? 'http://stub/').search;

afterEach(() => {
  cleanup();
});

describe('EvalsCompare', () => {
  it('titles the page under a breadcrumb back to the overview', async () => {
    renderWith({ choices: CHOICES, comparison: undefined });

    const title = await screen.findByRole('heading', { level: 1 });

    expect(title.textContent).toBe('Compare runs');

    expect(breadcrumbTrail()).toEqual(evalsTrail('compare'));
  });

  it('shows the flipped tasks, the totals and the one changed input', async () => {
    renderWith({ choices: [], comparison: COMPARISON });

    const flips = await screen.findByRole('table', {
      name: '2 of 7 tasks changed verdict',
    });
    const [regressed, improved] = tableCells(flips);
    const totals = screen.getByRole('table', { name: 'Run A against run B' });
    const [passRate] = tableCells(totals);

    expect(tableHeaders(flips)).toEqual([
      'Task',
      'Subject',
      'A',
      'B',
      'Change',
    ]);
    expect(regressed?.map(({ column }) => column)).toEqual([
      'taskKey',
      'subjectName',
      'a',
      'b',
      'change',
    ]);
    expect(regressed?.map(({ text }) => text)).toEqual([
      't1',
      'react-19',
      '3/3',
      '1/3',
      'regressed',
    ]);
    expect(improved?.map(({ text }) => text)).toEqual([
      't2',
      'react-19',
      '1/3',
      '3/3',
      'improved',
    ]);
    expect(regressed?.[2]?.className).toBe(regressed?.[3]?.className);
    expect(regressed?.[2]?.className).not.toBe(regressed?.[0]?.className);
    expect(
      within(flips)
        .getAllByRole('link', { name: 'react-19' })
        .map((link) => link.getAttribute('href')),
    ).toEqual([
      '/evals/subjects/skill/react-19',
      '/evals/subjects/skill/react-19',
    ]);
    expect(
      within(flips).getByText('regressed').closest('td')?.textContent,
    ).toBe('regressed');
    expect(within(flips).getByText('regressed').tagName).toBe('SPAN');
    expect(within(flips).getByText('improved').tagName).toBe('TD');
    expect(tableHeaders(totals)).toEqual(['Total', 'A', 'B', 'Change']);
    expect(passRate?.map(({ column }) => column)).toEqual([
      'metric',
      'a',
      'b',
      'change',
    ]);
    expect(passRate?.map(({ text }) => text)).toEqual([
      'Pass rate',
      '100%',
      '50%',
      '-50 pts',
    ]);
    expect(
      new Set(passRate?.slice(1).map(({ className }) => className)).size,
    ).toBe(1);
    expect(passRate?.[1]?.className).not.toBe(passRate?.[0]?.className);
    expect(
      screen.getByText('One cause: skill react-19 content.'),
    ).toBeDefined();
    expect(
      screen
        .getAllByRole('heading', { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(['Flipped tasks', 'Totals', 'Changed inputs']);
    expect(
      [COMPARISON.a, COMPARISON.b].map(
        (side) =>
          screen.getByRole('link', { name: runChoiceLabel(side) }).parentElement
            ?.textContent,
      ),
    ).toEqual([
      `A: ${runChoiceLabel(COMPARISON.a)}`,
      `B: ${runChoiceLabel(COMPARISON.b)}`,
    ]);
    expect(
      screen
        .getAllByRole('link')
        .map((link) => link.getAttribute('href'))
        .filter((href) => href?.startsWith('/evals/runs/')),
    ).toEqual(['/evals/runs/run-a', '/evals/runs/run-b']);
  });

  it('says when no task flipped and when no input changed', async () => {
    renderWith({
      choices: [],
      comparison: {
        ...COMPARISON,
        changes: { kind: 'none' },
        flips: [],
      },
    });

    expect(
      await screen.findByText('None of the 7 tasks changed its verdict.'),
    ).toBeDefined();
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(
      screen.getByText('No input hash changed between the runs.'),
    ).toBeDefined();
  });

  it('names every input when several changed', async () => {
    renderWith({
      choices: [],
      comparison: {
        ...COMPARISON,
        changes: { changed: ['model', 'catalog'], kind: 'multiple' },
      },
    });

    expect(
      await screen.findByText('2 inputs changed: model, catalog.'),
    ).toBeDefined();
  });

  it('prefills the older run as A and the newer as B, so an unchanged submit reads forward in time', async () => {
    renderWith({ choices: CHOICES, comparison: undefined });

    const runA = await screen.findByRole('combobox', { name: 'Run A' });
    const runB = screen.getByRole('combobox', { name: 'Run B' });

    expect([runA.getAttribute('name'), runB.getAttribute('name')]).toEqual([
      'a',
      'b',
    ]);
    expect([
      (runA as HTMLSelectElement).value,
      (runB as HTMLSelectElement).value,
    ]).toEqual(['run-before', 'run-newest']);
    expect(
      screen.getByRole('textbox', { name: 'Branch' }).getAttribute('name'),
    ).toBe('branch');
  });

  it('submits the picked pair as the same ?a=&b= query string', async () => {
    const loader = renderWith({ choices: CHOICES, comparison: undefined });

    fireEvent.change(await screen.findByRole('combobox', { name: 'Run A' }), {
      target: { value: 'run-newest' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Run B' }), {
      target: { value: 'run-before' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Compare runs' }));

    await waitFor(() => {
      expect(searchOfLastLoad(loader)).toBe('?a=run-newest&b=run-before');
    });
  });

  it('submits the branch as the same ?branch= query string', async () => {
    const loader = renderWith({ choices: CHOICES, comparison: undefined });

    fireEvent.change(await screen.findByRole('textbox', { name: 'Branch' }), {
      target: { value: 'feat/trigger-wording' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Compare with main' }));

    await waitFor(() => {
      expect(searchOfLastLoad(loader)).toBe('?branch=feat%2Ftrigger-wording');
    });
  });

  it('offers both pickers with no run to choose on an empty history', async () => {
    renderWith({ choices: [], comparison: undefined });

    const runA = await screen.findByRole('combobox', { name: 'Run A' });

    expect((runA as HTMLSelectElement).value).toBe('');
    expect(
      (screen.getByRole('combobox', { name: 'Run B' }) as HTMLSelectElement)
        .value,
    ).toBe('');
  });

  it.each([
    { busy: 'Compare runs', idle: 'Compare with main' },
    { busy: 'Compare with main', idle: 'Compare runs' },
  ])(
    'marks only the $busy form busy while its comparison loads',
    async ({ busy, idle }) => {
      const Stub = createRoutesStub([
        {
          Component: EvalsCompare,
          loader: ({ request }: LoaderFunctionArgs) =>
            new URL(request.url).search === ''
              ? { choices: CHOICES, comparison: undefined }
              : new Promise<never>(() => {}),
          path: '/evals/compare',
        },
      ]);

      render(<Stub initialEntries={['/evals/compare']} />);

      fireEvent.change(await screen.findByRole('textbox', { name: 'Branch' }), {
        target: { value: 'feat/x' },
      });

      const submitted = screen.getByRole('button', { name: busy });
      const other = screen.getByRole('button', { name: idle });

      expect(submitted.hasAttribute('disabled')).toBe(false);

      fireEvent.click(submitted);

      await waitFor(() => {
        expect(submitted.hasAttribute('disabled')).toBe(true);
      });
      expect(other.hasAttribute('disabled')).toBe(false);
    },
  );
});
