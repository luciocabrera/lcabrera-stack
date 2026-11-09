// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { EVALS_COST_LABELS } from '../constants/evalsDashboard.constants';
import { COST_TABLE_COLUMNS } from './costTableColumns.util';

const ROW = {
  computed: '$0.0244',
  name: 'skills',
  p50: '15s',
  p95: '21s',
  reported: 'not reported',
  tokensCache: '300 read, 60 written',
  tokensIn: '3,000',
  tokensOut: '600',
  trials: '3',
};

afterEach(cleanup);

describe('COST_TABLE_COLUMNS', () => {
  it('lays the name and then eight figures, each right-aligned by its data type', () => {
    expect(
      COST_TABLE_COLUMNS.map(({ align, dataType, key, label }) => [
        key,
        label,
        align,
        dataType,
      ]),
    ).toEqual([
      ['name', 'Name', undefined, undefined],
      ['trials', 'Trials', 'end', 'number'],
      ['tokensIn', 'Tokens in', 'end', 'number'],
      ['tokensOut', 'Tokens out', 'end', 'number'],
      ['tokensCache', 'Cache tokens', 'end', 'number'],
      ['reported', EVALS_COST_LABELS.reported, 'end', 'currency'],
      ['computed', EVALS_COST_LABELS.computed, 'end', 'currency'],
      ['p50', 'p50 duration', 'end', 'number'],
      ['p95', 'p95 duration', 'end', 'number'],
    ]);
  });

  it('shows each figure exactly as the loader formatted it', () => {
    expect(
      COST_TABLE_COLUMNS.slice(1).map(({ render: draw }) => draw?.(ROW)),
    ).toEqual([
      '3',
      '3,000',
      '600',
      '300 read, 60 written',
      'not reported',
      '$0.0244',
      '15s',
      '21s',
    ]);
  });

  it('links a name that has a page and leaves the rest as text', () => {
    const [name] = COST_TABLE_COLUMNS;

    expect(name?.render?.(ROW)).toBe('skills');

    render(
      <MemoryRouter>
        {name?.render?.({ ...ROW, href: '/evals/runs/r1', name: 'skills run' })}
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('link', { name: 'skills run' }).getAttribute('href'),
    ).toBe('/evals/runs/r1');
  });
});
