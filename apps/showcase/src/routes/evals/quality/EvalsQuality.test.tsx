// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EvalsQuality } from './EvalsQuality.component';

const renderWith = (data: unknown) => {
  const Stub = createRoutesStub([
    { Component: EvalsQuality, loader: () => data, path: '/evals/quality' },
  ]);

  return render(<Stub initialEntries={['/evals/quality']} />);
};

afterEach(() => {
  cleanup();
});

describe('EvalsQuality', () => {
  it('draws a row per dimension with its band and trend', async () => {
    const point = {
      href: '/evals/runs/r1',
      key: 'r1',
      label: 'Run r1, 2026-10-01: 3.00 over 1 trials',
      tone: 'error',
      value: 3,
    };

    renderWith({
      runs: ['r1'],
      skills: [
        {
          baseline: { modelId: 'model-a', runs: 5 },
          dimensions: [
            {
              band: { lower: 3.5, mean: 4, runs: 5, upper: 4.5 },
              dimension: 'clarity',
              latest: point,
              points: [point],
            },
          ],
          kind: 'skill',
          name: 'react-19',
        },
      ],
    });

    const table = await screen.findByRole('table', {
      name: 'react-19: rubric dimensions',
    });

    expect(table.textContent).toContain('3.50 to 4.50');
    expect(table.textContent).toContain('3.00');
    expect(screen.getByText('Baseline of 5 runs on model-a.')).toBeDefined();
    expect(
      screen.getByRole('link', { name: 'react-19' }).getAttribute('href'),
    ).toBe('/evals/subjects/skill/react-19');
    expect(
      screen.getByRole('figure', {
        name: 'react-19 clarity over its last 1 scored runs',
      }),
    ).toBeDefined();
  });

  it('says when no quality run is stored', async () => {
    renderWith({ runs: [], skills: [] });

    expect(
      await screen.findByText('No skill-quality run is stored yet.'),
    ).toBeDefined();
  });
});
