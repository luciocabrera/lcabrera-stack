// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  HEALTH_CLASS_COLUMNS,
  HEALTH_RUN_COLUMNS,
} from './EvalsHealth.constants';

const shapeOf = (
  columns: readonly {
    readonly align?: string;
    readonly dataType?: string;
    readonly key: string;
    readonly label: string;
  }[],
) =>
  columns.map(({ align, dataType, key, label }) => [
    key,
    label,
    align,
    dataType,
  ]);

const CLASS = {
  errorClass: 'rate_limit',
  id: 'error/rate_limit',
  isRateLimit: true,
  outcome: 'error' as const,
  runs: 1,
  trials: 2,
};

afterEach(cleanup);

describe('HEALTH_CLASS_COLUMNS', () => {
  it('lays outcome and class as text and right-aligns the counts', () => {
    expect(shapeOf(HEALTH_CLASS_COLUMNS)).toEqual([
      ['outcome', 'Outcome', undefined, undefined],
      ['errorClass', 'Error class', undefined, undefined],
      ['trials', 'Trials', 'end', 'number'],
      ['runs', 'Runs', 'end', 'number'],
    ]);
  });

  it('badges a rate-limit class and leaves any other as text', () => {
    const draw = HEALTH_CLASS_COLUMNS[1]?.render;

    expect(
      draw?.({ ...CLASS, errorClass: 'execution', isRateLimit: false }),
    ).toBe('execution');

    render(<div>{draw?.(CLASS)}</div>);

    expect(screen.getByText('rate_limit').tagName).toBe('SPAN');
  });
});

describe('HEALTH_RUN_COLUMNS', () => {
  it('links the run and right-aligns its counts', () => {
    expect(shapeOf(HEALTH_RUN_COLUMNS)).toEqual([
      ['label', 'Run', undefined, undefined],
      ['trials', 'Trials', 'end', 'number'],
      ['errors', 'Errors', 'end', 'number'],
      ['timeouts', 'Timeouts', 'end', 'number'],
      ['rateLimits', 'Rate limits', 'end', 'number'],
    ]);

    render(
      <MemoryRouter>
        {HEALTH_RUN_COLUMNS[0]?.render?.({
          errors: 1,
          href: '/evals/runs/r1',
          label: '2026-10-13 02:00 on main',
          rateLimits: 0,
          runId: 'r1',
          timeouts: 0,
          trials: 15,
        })}
      </MemoryRouter>,
    );

    expect(
      screen
        .getByRole('link', { name: '2026-10-13 02:00 on main' })
        .getAttribute('href'),
    ).toBe('/evals/runs/r1');
  });
});
