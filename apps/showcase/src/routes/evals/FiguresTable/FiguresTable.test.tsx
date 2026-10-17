// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { FiguresTable } from './FiguresTable.component';

afterEach(() => {
  cleanup();
});

describe('FiguresTable', () => {
  it('renders a captioned table with a header cell per column', () => {
    render(
      <FiguresTable
        caption='Cost per suite'
        columns={[
          { key: 'suite', label: 'Suite' },
          { isNumeric: true, key: 'trials', label: 'Trials' },
        ]}
        rows={[
          { cells: { suite: 'skills', trials: 42 }, key: 'skills' },
          { cells: { suite: 'skill-quality', trials: 7 }, key: 'quality' },
        ]}
      />,
    );

    const table = screen.getByRole('table', { name: 'Cost per suite' });

    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Suite', 'Trials']);
    expect(
      within(table)
        .getAllByRole('row')
        .slice(1)
        .map((row) => row.textContent),
    ).toEqual(['skills42', 'skill-quality7']);
  });

  it('leaves a cell empty when its row has no value for that column', () => {
    render(
      <FiguresTable
        caption='Gaps'
        columns={[{ key: 'missing', label: 'Missing' }]}
        rows={[{ cells: {}, key: 'only' }]}
      />,
    );

    expect(screen.getByRole('cell').textContent).toBe('');
  });
});
