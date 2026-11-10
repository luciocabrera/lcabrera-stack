// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { breadcrumbTrail, evalsTrail } from '../utils/pageHeader.fixtures';
import { tableCells, tableHeaders } from '../utils/staticTable.fixtures';
import { EvalsQuality } from './EvalsQuality.component';
import { EVALS_QUALITY_HANDLE } from './EvalsQuality.constants';

const renderWith = (data: unknown) => {
  const Stub = createRoutesStub([
    {
      Component: EvalsQuality,
      handle: EVALS_QUALITY_HANDLE,
      loader: () => data,
      path: '/evals/quality',
    },
  ]);

  return render(<Stub initialEntries={['/evals/quality']} />);
};

type PointArgs = {
  readonly tone: string;
  readonly value: number;
};

const point = ({ tone, value }: PointArgs) => ({
  label: `Run r1, 2026-10-01: ${value.toFixed(2)} over 1 trials`,
  to: '/evals/runs/r1',
  tone,
  value,
});

afterEach(() => {
  cleanup();
});

describe('EvalsQuality', () => {
  it('draws a row per dimension with its band and trend', async () => {
    const below = point({ tone: 'error', value: 3 });
    const unbanded = point({ tone: 'neutral', value: 4 });

    renderWith({
      runs: ['r1'],
      skills: [
        {
          baseline: { modelId: 'model-a', runs: 5 },
          dimensions: [
            {
              band: { lower: 3.5, mean: 4, runs: 5, upper: 4.5 },
              dimension: 'clarity',
              latest: below,
              points: [below],
            },
            {
              band: undefined,
              dimension: 'examples',
              latest: unbanded,
              points: [unbanded],
            },
            {
              band: undefined,
              dimension: 'tone',
              latest: undefined,
              points: [],
            },
          ],
          kind: 'skill',
          name: 'react-19',
        },
        {
          baseline: undefined,
          dimensions: [],
          kind: 'skill',
          name: 'unslop',
        },
      ],
    });

    const table = await screen.findByRole('table', {
      name: 'react-19: rubric dimensions',
    });
    const [clarity, examples, unscored] = tableCells(table);

    expect(tableHeaders(table)).toEqual([
      'Dimension',
      'Latest',
      'Baseline band',
      'Over the recent runs',
    ]);
    expect(clarity?.map(({ column }) => column)).toEqual([
      'dimension',
      'latest',
      'band',
      'points',
    ]);
    expect(clarity?.slice(0, 3).map(({ text }) => text)).toEqual([
      'clarity',
      '3.00',
      '3.50 to 4.50',
    ]);
    expect(examples?.slice(0, 3).map(({ text }) => text)).toEqual([
      'examples',
      '4.00',
      'none',
    ]);
    expect(unscored?.slice(0, 3).map(({ text }) => text)).toEqual([
      'tone',
      'not scored',
      'none',
    ]);
    expect(clarity?.[1]?.className).toBe(clarity?.[2]?.className);
    expect(clarity?.[1]?.className).not.toBe(clarity?.[3]?.className);
    expect(screen.getByText('Baseline of 5 runs on model-a.')).toBeDefined();
    expect(
      screen.getByText('No quality baseline is recorded for this skill.'),
    ).toBeDefined();

    const heading = screen.getByRole('heading', { level: 2, name: 'react-19' });

    expect(
      within(heading)
        .getByRole('link', { name: 'react-19' })
        .getAttribute('href'),
    ).toBe('/evals/subjects/skill/react-19');

    const trend = screen.getByRole('group', {
      name: 'react-19 clarity over its last 1 scored runs',
    });

    expect(
      within(trend)
        .getByRole('link', { name: below.label })
        .getAttribute('href'),
    ).toBe('/evals/runs/r1');

    expect(breadcrumbTrail()).toEqual(evalsTrail('quality'));
  });

  it('says when no quality run is stored', async () => {
    renderWith({ runs: [], skills: [] });

    expect(
      await screen.findByText('No skill-quality run is stored yet.'),
    ).toBeDefined();
    expect(screen.queryByRole('table')).toBeNull();
  });
});
